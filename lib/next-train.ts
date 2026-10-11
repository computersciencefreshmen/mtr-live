import { findStation } from "./mtr-stations";

export const MAX_SOURCE_AGE_MS = 45_000;
const OFFICIAL_API = "https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php";
const RESPONSE_HEADERS = {
  "Cache-Control": "no-store, max-age=0",
  "CDN-Cache-Control": "no-store",
  "Cloudflare-CDN-Cache-Control": "no-store",
  "X-Data-Source": "MTR Corporation / DATA.GOV.HK",
};

export function parseHongKongTime(value: unknown): number {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) return NaN;
  return Date.parse(value.replace(" ", "T") + "+08:00");
}

function failure(code: string, message: string, status: number, official?: unknown): Response {
  return Response.json({ error: { code, message }, ...(official ? { official } : {}) }, {
    status,
    headers: RESPONSE_HEADERS,
  });
}

// Fetches only the public, fixed-origin MTR endpoint; there is no alternate feed.
export async function getNextTrain(request: Request): Promise<Response> {
  const query = new URL(request.url).searchParams;
  const station = (query.get("sta") ?? "OCP").toUpperCase();
  const line = (query.get("line") ?? "SIL").toUpperCase();
  if (!findStation(`${line}-${station}`)) {
    return failure("INVALID_STATION", "Select a station supported by the official MTR Next Train API.", 400);
  }
  const endpoint = new URL(OFFICIAL_API);
  endpoint.search = new URLSearchParams({ line, sta: station, lang: "TC" }).toString();
  const started = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const upstream = await fetch(endpoint.toString(), {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
      redirect: "manual",
    });
    if (!upstream.ok) {
      return failure(upstream.status === 429 ? "RATE_LIMITED" : "UPSTREAM_HTTP_ERROR",
        "The official MTR feed returned HTTP " + upstream.status + ".", upstream.status === 429 ? 503 : 502);
    }
    const json = await upstream.json() as Record<string, any>;
    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return failure("INVALID_RESPONSE", "The official feed did not return a schedule.", 502);
    }
    if (String(json.status) !== "1") {
      return failure("OFFICIAL_SERVICE_ALERT", String(json.message ?? "MTR schedule temporarily unavailable."), 503,
        { status: json.status, message: json.message, url: json.url });
    }
    const record = json.data?.[`${line}-${station}`];
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      return failure("MISSING_STATION_DATA", "The official feed has no data for this station.", 502);
    }
    // Station timestamp is authoritative when present: fresh outer metadata must
    // never conceal an old station record. Dummy `ttnt`/`valid` are unused.
    const sourceTime = parseHongKongTime(record.curr_time ?? json.curr_time);
    const fetchedAt = Date.now();
    if (!Number.isFinite(sourceTime)) {
      return failure("MISSING_SOURCE_TIME", "The official schedule timestamp could not be verified.", 502);
    }
    const age = fetchedAt - sourceTime;
    if (age > MAX_SOURCE_AGE_MS || age < -15_000) {
      return failure("STALE_OFFICIAL_DATA", "The official schedule is outside the live-data window.", 503);
    }
    return Response.json({ ...json, _meta: {
      fetched_at: new Date(fetchedAt).toISOString(),
      source_time: new Date(sourceTime).toISOString(),
      source_age_ms: Math.max(0, age),
      request_duration_ms: fetchedAt - started,
    } }, { headers: RESPONSE_HEADERS });
  } catch (error) {
    console.error("MTR official fetch failed:", error instanceof Error ? error.message : String(error));
    return failure(controller.signal.aborted ? "UPSTREAM_TIMEOUT" : "UPSTREAM_UNAVAILABLE",
      controller.signal.aborted ? "The official MTR feed timed out." : "The official MTR feed could not be reached.", 502);
  } finally {
    clearTimeout(timeout);
  }
}

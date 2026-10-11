import { findStation, type LineCode } from "./mtr-stations";

export type Train = {
  time?: string;
  dest?: string;
  plat?: string | number;
  seq?: string;
  timetype?: string;
  route?: string;
};

type VerifiedTrain = Train & {
  time: string;
  dest: string;
  plat: string;
  eta: number;
  delta: number;
};

function parseHongKongArrival(value: unknown): number {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(value)) return NaN;
  const normalized = value.replace(" ", "T");
  const epoch = Date.parse(normalized + "+08:00");
  if (!Number.isFinite(epoch)) return NaN;
  // Date.parse can normalize nonexistent dates or 24:00 into another day.
  // Round-trip in Hong Kong time so those records never become live rows.
  const actual = new Date(epoch + 8 * 60 * 60 * 1_000).toISOString().slice(0, 19);
  return actual === normalized ? epoch : NaN;
}

function readPlatform(value: unknown): string | undefined {
  if (typeof value === "number") {
    return Number.isSafeInteger(value) && value > 0 ? String(value) : undefined;
  }
  // Airport Express can report shared platforms such as "1/3" or "2/4".
  return typeof value === "string" && /^[1-9]\d*(?:\/[1-9]\d*)*$/.test(value) ? value : undefined;
}

/** Filters official records; it neither creates train rows nor infers A/D. */
export function getVerifiedTrains(
  trains: unknown,
  officialNow: number,
  line: LineCode,
  limit = 2,
): Array<Train & { time: string; dest: string; plat: string; eta: number; delta: number }> {
  if (!Array.isArray(trains) || !Number.isFinite(officialNow) || !Number.isFinite(limit) || limit < 1) return [];
  const count = Math.floor(limit);
  const verified: VerifiedTrain[] = [];
  for (const value of trains) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const record = value as Record<string, unknown>;
    const eta = parseHongKongArrival(record.time);
    const delta = eta - officialNow;
    if (!Number.isFinite(eta) || delta < 0) continue;
    const dest = record.dest;
    if (typeof dest !== "string" || !/^[A-Z]{3}$/.test(dest) || !findStation(`${line}-${dest}`)) continue;
    const plat = readPlatform(record.plat);
    if (plat === undefined) continue;
    // The official feed uses timeType. Normalize it for the UI without
    // inventing A/D; older lowercase data is accepted only if absent.
    const timeType = Object.prototype.hasOwnProperty.call(record, "timeType") ? record.timeType : record.timetype;
    verified.push({
      time: record.time as string,
      dest,
      plat,
      eta,
      delta,
      ...(typeof record.seq === "string" ? { seq: record.seq } : {}),
      ...(typeof timeType === "string" ? { timetype: timeType } : {}),
      ...(typeof record.route === "string" ? { route: record.route } : {}),
    });
    // Limit after validation, preserving the order of the official array.
    if (verified.length === count) break;
  }
  return verified;
}

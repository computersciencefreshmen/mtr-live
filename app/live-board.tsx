"use client";

import { useEffect, useRef, useState } from "react";

import { findStation, getStationName, LINE_CODES, LINES, STATIONS, stationsForLine, type StationKey } from "../lib/mtr-stations";
import { getDisplayGroups } from "../lib/station-displays";
import { getVerifiedTrains, type Train } from "../lib/verified-arrivals";
import StationChooser from "./station-chooser";
import type { CSSProperties } from "react";

type Language = "tc" | "en";
type Direction = "UP" | "DOWN";
type StationRecord = { UP?: Train[]; DOWN?: Train[] };
type NextTrainResponse = {
  status?: string | number;
  data?: Record<string, unknown>;
  isdelay?: string;
  _meta?: { source_time?: unknown; fetched_at?: unknown; source_age_ms?: unknown };
};
type Feed = {
  station: StationKey;
  record: StationRecord;
  sourceEpoch: number;
  fetchedEpoch: number;
  sourceAge: number;
  receivedPerf: number;
  delayed: boolean;
};
type Failure = "fetch" | "timeout" | "source" | "service";
const FRESHNESS_MS = 45_000;
const hkFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Hong_Kong", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
});

function parseUTC(value: unknown): number {
  return typeof value === "string" && value.endsWith("Z") ? Date.parse(value) : NaN;
}

function timeHK(epoch: number): string {
  return Number.isFinite(epoch) ? hkFormatter.format(epoch) : "—";
}

export default function LiveBoard() {
  const [station, setStation] = useState<StationKey | null>(null);
  const [residentKey, setResidentKey] = useState<StationKey>("SIL-OCP");
  const [residentEditing, setResidentEditing] = useState(false);
  const [residentQuery, setResidentQuery] = useState("");
  const [query, setQuery] = useState("");
  const [savedResident, setSavedResident] = useState(false);
  const [language, setLanguage] = useState<Language>("tc");
  const [ready, setReady] = useState(false);
  const [feeds, setFeeds] = useState<Partial<Record<StationKey, Feed>>>({});
  const [failures, setFailures] = useState<Partial<Record<StationKey, Failure>>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [nowPerf, setNowPerf] = useState(0);
  const [groupIndex, setGroupIndex] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotationPaused, setRotationPaused] = useState(false);
  const touchStartRef = useRef<number | null>(null);
  const refreshRef = useRef<(() => void) | null>(null);
  const t = (tc: string, en: string) => language === "tc" ? tc : en;
  const selected = station ? findStation(station) : undefined;
  const displayGroups = station ? getDisplayGroups(station) : [];
  const visibleGroup = displayGroups[groupIndex] ?? displayGroups[0];

  // The homepage opens the station picker; a station URL opens its live display.
  useEffect(() => {
    const readStation = () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("station");
      const selected = code ? findStation(code.includes("-") ? code : `${params.get("line") || "SIL"}-${code}`) : undefined;
      setFeeds({});
      setFailures({});
      setRefreshing(!!selected);
      setGroupIndex(0);
      setStation(selected?.key ?? null);
    };
    readStation();
    try {
      const saved = findStation(window.localStorage.getItem("mtr-live-resident") || "");
      if (saved) setResidentKey(saved.key);
    } catch { /* The default also works when browser storage is disabled. */ }
    setReady(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setAutoRotate(false);
    window.addEventListener("popstate", readStation);
    return () => window.removeEventListener("popstate", readStation);
  }, []);

  useEffect(() => {
    const tick = () => setNowPerf(performance.now());
    tick();
    const timer = window.setInterval(tick, 1_000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "tc" ? "zh-Hant" : "en";
    const selected = station ? findStation(station) : undefined;
    document.title = `${selected ? language === "tc" ? selected.nameTc : selected.nameEn : language === "tc" ? "選擇車站" : "Choose a station"} · MTR Live`;
  }, [language, station]);

  useEffect(() => {
    if (displayGroups.length < 2 || !autoRotate || rotationPaused) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") setGroupIndex((index) => (index + 1) % displayGroups.length);
    }, 12_000);
    return () => window.clearInterval(timer);
  }, [station, displayGroups.length, autoRotate, rotationPaused]);

  useEffect(() => {
    if (!ready || !station) return;
    const requested = getDisplayGroups(station).flatMap((group) => group.stations);
    if (!requested.length) return;
    let disposed = false;
    let pending = false;
    let controller: AbortController | null = null;
    let timeout: ReturnType<typeof setTimeout> | undefined;
    setFeeds({});
    setFailures({});
    setRefreshing(true);

    const fetchData = async () => {
      // Polling and manual refresh share one guard; each station group has one active batch.
      if (disposed || pending) return;
      pending = true;
      let timedOut = false;
      const requestController = new AbortController();
      controller = requestController;
      timeout = setTimeout(() => {
        timedOut = true;
        controller?.abort();
      }, 10_000);
      setRefreshing(true);
      const requestOne = async (item: typeof requested[number]) => {
        let reason: Failure = "fetch";
        try {
          const response = await fetch(`/api/next-train?line=${item.line}&sta=${item.code}`, {
            cache: "no-store", signal: requestController.signal,
          });
          if (!response.ok) throw new Error("API unavailable");
          const raw = await response.json();
          if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("Invalid API response");
          const json = raw as NextTrainResponse;
          if (disposed) return;
          reason = "service";
          if (String(json.status) !== "1") throw new Error("Official service unavailable");
          const record = json.data?.[item.key] as StationRecord | undefined;
          if (!record || typeof record !== "object" || Array.isArray(record)) throw new Error("No station record");
          reason = "source";
          const sourceEpoch = parseUTC(json._meta?.source_time);
          const fetchedEpoch = parseUTC(json._meta?.fetched_at);
          const sourceAge = json._meta?.source_age_ms;
          if (!Number.isFinite(sourceEpoch) || !Number.isFinite(fetchedEpoch)
            || typeof sourceAge !== "number" || !Number.isFinite(sourceAge) || sourceAge < 0) {
            throw new Error("Unverifiable official timestamp");
          }
          for (const direction of ["UP", "DOWN"] as const) {
            const trains = record[direction];
            if (trains !== undefined && !Array.isArray(trains)) throw new Error("Invalid train list");
          }
          if (disposed) return;
          const receivedPerf = performance.now();
          setNowPerf(receivedPerf);
          setFeeds((previous) => ({ ...previous, [item.key]: { station: item.key, record, sourceEpoch, fetchedEpoch, sourceAge, receivedPerf, delayed: json.isdelay === "Y" } }));
          setFailures((previous) => ({ ...previous, [item.key]: undefined }));
        } catch {
          if (disposed) return;
          // Only this line's countdowns are invalidated; another verified line stays usable.
          setFeeds((previous) => ({ ...previous, [item.key]: undefined }));
          setFailures((previous) => ({ ...previous, [item.key]: timedOut ? "timeout" : reason }));
          setNowPerf(performance.now());
        }
      };
      try {
        await Promise.all(requested.map(requestOne));
      } finally {
        if (timeout !== undefined) clearTimeout(timeout);
        timeout = undefined;
        pending = false;
        controller = null;
        if (!disposed) setRefreshing(false);
      }
    };
    const requestRefresh = () => { void fetchData(); };
    const onVisible = () => {
      if (document.visibilityState === "visible") requestRefresh();
    };
    refreshRef.current = requestRefresh;
    requestRefresh();
    const poll = window.setInterval(requestRefresh, 10_000);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      disposed = true;
      controller?.abort();
      if (timeout !== undefined) clearTimeout(timeout);
      window.clearInterval(poll);
      document.removeEventListener("visibilitychange", onVisible);
      if (refreshRef.current === requestRefresh) refreshRef.current = null;
    };
  }, [station, ready]);

  const feedState = (key: StationKey) => {
    const feed = feeds[key];
    const elapsed = feed ? Math.max(0, nowPerf - feed.receivedPerf) : Infinity;
    const verified = !!feed && elapsed < FRESHNESS_MS && feed.sourceAge + elapsed < FRESHNESS_MS;
    return { feed, verified, stale: !!feed && !verified, failure: failures[key],
      // This clock advances from official time and monotonic elapsed time, independent of the visitor's clock.
      officialNow: verified && feed ? feed.sourceEpoch + feed.sourceAge + elapsed : NaN,
    };
  };
  const displayedStates = visibleGroup?.stations.map((item) => feedState(item.key)) ?? [];
  const verifiedCount = displayedStates.filter((state) => state.verified).length;
  const verified = !!displayedStates.length && verifiedCount === displayedStates.length;
  const stale = displayedStates.some((state) => state.stale);
  const failure = displayedStates.find((state) => state.failure)?.failure;
  const waiting = !verifiedCount && !failure && refreshing;
  const statusText = verified
    ? refreshing ? t("實時數據 · 更新中", "Live data · refreshing") : t("實時數據已連接", "Live feed connected")
    : verifiedCount ? t("部分路綫資料已驗證", "Some lines verified")
    : waiting ? t("正在連接官方數據", "Connecting to official data")
      : t("即時數據未能驗證", "Live data unavailable");
  const bannerText = stale
    ? t("有路綫的官方資料已過期，該綫到站列表已隱藏；每 10 秒重新核實。", "A line's official data has expired. Its arrival list is hidden; rechecking every 10 seconds.")
    : failure === "source"
      ? t("有路綫的官方資料時間無法驗證，該綫到站列表已隱藏；每 10 秒重試。", "A line's official timestamp could not be verified. Its arrival list is hidden; retrying every 10 seconds.")
      : failure === "timeout"
        ? t("有路綫的官方資料請求逾時，該綫到站列表已隱藏；每 10 秒重試。", "A line's official request timed out. Its arrival list is hidden; retrying every 10 seconds.")
        : failure
          ? t("有路綫未能取得官方到站資料，該綫到站列表已隱藏；每 10 秒重試。", "A line's official arrival data is unavailable. Its arrival list is hidden; retrying every 10 seconds.")
          : displayedStates.some((state) => state.verified && state.feed?.delayed)
            ? t("港鐵標示列車服務可能延誤，請以車站公告為準。", "MTR reports possible service delays. Please follow station announcements.")
            : "";

  const changeStation = (selected: StationKey | null) => {
    if (selected === station) return;
    setFeeds({});
    setFailures({});
    setRefreshing(selected !== null);
    setGroupIndex(0);
    setStation(selected);
    const url = new URL(window.location.href);
    const next = selected ? findStation(selected) : undefined;
    if (next) {
      url.searchParams.set("line", next.line);
      url.searchParams.set("station", next.code);
    } else {
      url.searchParams.delete("station");
      url.searchParams.delete("line");
    }
    window.history.pushState({}, "", url);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const resident = findStation(residentKey)!;
  const stationName = (item: { nameTc: string; nameEn: string }) => language === "tc" ? item.nameTc : item.nameEn;
  const stationSecondary = (item: { nameTc: string; nameEn: string }) => language === "tc" ? item.nameEn : item.nameTc;
  const setResident = (key: StationKey) => {
    setResidentKey(key);
    setResidentEditing(false);
    setResidentQuery("");
    setSavedResident(true);
    try { window.localStorage.setItem("mtr-live-resident", key); } catch { /* Keep the preference for this visit. */ }
  };
  const renderSearchResults = (text: string, onChoose: (key: StationKey) => void) => {
    const search = text.trim().toLocaleLowerCase();
    if (!search) return null;
    const results = STATIONS.filter((item) => [item.nameTc, item.nameEn, item.code, LINES[item.line].nameTc, LINES[item.line].nameEn, item.line].some((value) => value.toLocaleLowerCase().includes(search))).slice(0, 12);
    return <div className="station-results" aria-label={t("車站搜尋結果", "Station search results")}>
      {results.length ? results.map((item) => <button type="button" key={item.key} onClick={() => onChoose(item.key)}><span><strong>{stationName(item)}</strong><small>{stationSecondary(item)}</small></span><span className="line-chip" style={{ "--line-color": LINES[item.line].color } as CSSProperties}>{stationName(LINES[item.line])}</span></button>) : <p>{t("找不到車站，請輸入中文、英文或車站代碼。", "No station found. Try a name or station code.")}</p>}
    </div>;
  };
  const renderDirection = (item: NonNullable<typeof selected>, direction: Direction) => {
    const state = feedState(item.key);
    // Filter every official record before limiting the list, so an expired first
    // forecast never hides the next valid train or becomes a placeholder row.
    const trains = state.verified ? getVerifiedTrains(state.feed?.record[direction], state.officialNow, item.line) : [];
    if (!trains.length) return null;
    return (
      <section className="direction-group" key={direction} aria-label={direction === "UP" ? t("上行列車", "Up trains") : t("下行列車", "Down trains")}>
        {trains.length ? trains.map((train, index) => {
          const { eta, delta } = train;
          const departure = train.timetype === "D";
          const arrival = train.timetype === "A" || (train.timetype === undefined && item.line !== "EAL");
          const dest = getStationName(train.dest || "");
          return (
            <div className="screen-row" key={`${direction}-${index}-${train.time}`}>
              <div className="dest-cell">
                <span className="destination" lang={language === "tc" ? "zh-Hant" : "en"}>{stationName(dest)}</span>
                <span className="row-eta">{departure ? t("預計開出 ", "Departs ") : arrival ? t("預計到達 ", "ETA ") : t("預計時間 ", "Forecast ")}{timeHK(eta)}{train.route === "RAC" ? t(" · 經馬場", " · via Racecourse") : ""}</span>
              </div>
              <span className={`platform-circle${train.plat.length > 2 ? " compact" : ""}`} aria-label={`${t("月台 ", "Platform ")}${train.plat}`}>{train.plat}</span>
              <div className="arrival-cell">
                {delta <= 60_000 && arrival ? <span className="arrival-status arriving">{t("即將抵達", "Arriving")}<small>{t("預計", "estimated")}</small></span>
                    : <><span className="minutes">{delta < 60_000 ? "<1" : Math.ceil(delta / 60_000)}</span><span className="unit">{t("分鐘", "min")}</span></>}
              </div>
            </div>
          );
        }) : null}
      </section>
    );
  };

  const renderBoard = (item: NonNullable<typeof selected>) => {
    const state = feedState(item.key);
    const hasTrains = state.verified && (["UP", "DOWN"] as const).some((direction) =>
      getVerifiedTrains(state.feed?.record[direction], state.officialNow, item.line).length > 0);
    return <div className="line-board" key={item.key}>
      <div className="screen-frame" style={{ "--line-color": LINES[item.line].color } as CSSProperties}>
        <section className="board" aria-label={`${stationName(LINES[item.line])} · ${t("列車預計到站時間", "Estimated train arrivals")}`}>
          <div className="board-head"><span className="line-title">{stationName(LINES[item.line])}</span><span className="board-station">{stationName(item)}</span></div>
          {renderDirection(item, "UP")}{renderDirection(item, "DOWN")}
        </section>
      </div>
      {!hasTrains && <div className="screen-message" role="status">
        {state.verified ? t("港鐵暫未提供有效的下一班列車預報。", "MTR has not supplied a valid upcoming-train forecast.")
          : refreshing && !state.failure && !state.stale ? t("正在核實港鐵官方資料…", "Verifying the official MTR feed…")
            : t("此綫到站資料暫未能驗證，列車列表已隱藏。", "This line's live data cannot be verified. The train list is hidden.")}
      </div>}
      <div className="line-source-clock">{t("官方資料 ", "Official source ")}{state.verified && state.feed ? timeHK(state.feed.sourceEpoch) : "—"}</div>
    </div>;
  };

  return (
    <main className="shell">
      <header className="topbar">
        <a className="brand" href="/" onClick={(event) => { event.preventDefault(); changeStation(null); }} aria-label={t("MTR Live · 返回選站", "MTR Live · choose a station")}>
          <img className="brand-logo" src="/assets/mtr-logo.png" width="54" height="54" alt="港鐵 MTR" />
          <span><span className="brand-wordmark">MTR Live</span><span className="brand-caption">{t("列車到站資訊", "Train arrival information")}</span></span>
        </a>
        <div className="header-tools">
          <div className="lang-switch" aria-label={t("顯示語言", "Display language")}>
            <button type="button" aria-pressed={language === "tc"} onClick={() => setLanguage("tc")}>繁</button>
            <button type="button" aria-pressed={language === "en"} onClick={() => setLanguage("en")}>EN</button>
          </div>
        </div>
      </header>

      {!selected ? (
        <section className="station-picker" aria-labelledby="picker-title">
          <div className="home-hero">
            <div className="line-label">{t("港鐵列車 · 即時到站", "MTR trains · live arrivals")}</div>
            <h1 id="picker-title">{t("下一班，幾時到？", "When is the next train?")}</h1>
            <p>{t("你的車站，你的到站屏。", "Your station. Your arrival display.")}</p>
          </div>
          <div className="home-panels">
            <section className="home-panel" aria-labelledby="resident-title">
              <span className="panel-eyebrow">{t("日常出行", "YOUR EVERYDAY JOURNEY")}</span><h2 id="resident-title">{t("常駐車站", "Home station")}</h2>
              <div className="resident-card" style={{ "--line-color": LINES[resident.line].color } as CSSProperties}><span className="line-chip">{stationName(LINES[resident.line])}</span><strong>{stationName(resident)}</strong><small>{stationSecondary(resident)}</small></div>
              <div className="panel-actions"><button type="button" className="primary-button" onClick={() => changeStation(resident.key)}>{t("查看到站屏 →", "View arrivals →")}</button><button type="button" className="secondary-button" aria-expanded={residentEditing} onClick={() => { setResidentEditing(!residentEditing); setSavedResident(false); }}>{t("修改常駐車站", "Change home station")}</button></div>
              {residentEditing && <div><label className="station-search"><span>{t("輸入常駐車站", "Enter your home station")}</span><input type="search" value={residentQuery} onChange={(event) => setResidentQuery(event.target.value)} placeholder={t("例如：海洋公園 / Ocean Park", "e.g. Ocean Park")} autoFocus /></label>{renderSearchResults(residentQuery, setResident)}</div>}
              {savedResident && <p className="picker-note" role="status">{t("已設為常駐車站，下次開啟會保留。", "Home station saved for your next visit.")}</p>}
            </section>
            <section className="home-panel" aria-labelledby="query-title">
              <span className="panel-eyebrow">{t("探索全綫", "EXPLORE THE NETWORK")}</span><h2 id="query-title">{t("查詢車站", "Find a station")}</h2>
              <label className="station-search"><span>{t("輸入車站名稱", "Enter a station name")}</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("中文、英文或車站代碼", "Name or station code")} /></label>
              {renderSearchResults(query, changeStation)}
              <div className="panel-actions"><button type="button" className="secondary-button" onClick={() => changeStation(STATIONS[Math.floor(Math.random() * STATIONS.length)].key)}>{t("隨機選一站 ↗", "Pick a random station ↗")}</button></div>
            </section>
          </div>
          <details className="network-list"><summary>{t("按路綫選擇車站", "Browse stations by line")}</summary><div className="network-lines">{LINE_CODES.map((code) => <section className="network-line" key={code} style={{ "--line-color": LINES[code].color } as CSSProperties}><h3>{stationName(LINES[code])}</h3><div>{stationsForLine(code).map((item) => <button type="button" key={item.key} onClick={() => changeStation(item.key)}>{stationName(item)}</button>)}</div></section>)}</div></details>
          <p className="picker-note">{t("港鐵 10 條鐵路綫 · 官方實時數據 · 選站後每 10 秒更新", "10 MTR railway lines · official live data · updates every 10 seconds after selection")}</p>
        </section>
      ) : (
        <>
          <section className="station-toolbar">
            <div className="station-title">
              <button type="button" className="back-button" onClick={() => changeStation(null)}>{t("← 選擇車站", "← Choose station")}</button>
              <h1>{stationName(selected!)}</h1>
              <p>{stationSecondary(selected!)}</p>
            </div>
            <div className="station-actions">
              <StationChooser station={selected.key} language={language} onChoose={changeStation} />
              <button type="button" className="refresh" disabled={refreshing} aria-busy={refreshing} onClick={() => refreshRef.current?.()} aria-label={t("立即更新到站資料", "Refresh arrivals")}>{refreshing ? t("↻ 更新中", "↻ Updating") : t("↻ 更新", "↻ Refresh")}</button>
            </div>
          </section>
          {bannerText && <div className="banner" role="alert">{bannerText}</div>}
          {displayGroups.length > 1 && <>
            <nav className="interchange-nav" aria-label={t("金鐘月台分組", "Admiralty platform groups")}>
              {displayGroups.map((group, index) => <button key={group.id} type="button" aria-pressed={groupIndex === index} onClick={() => { setGroupIndex(index); setAutoRotate(false); }}><strong>{stationName(group)}</strong><small>{language === "tc" ? group.descriptionTc : group.descriptionEn}</small></button>)}
            </nav>
            <div className="interchange-controls"><span>{t("左右滑動切換 · ", "Swipe to switch · ")}{autoRotate ? t("每 12 秒輪播", "rotates every 12 seconds") : t("手動切換", "manual viewing")}</span><button type="button" aria-pressed={!autoRotate} onClick={() => setAutoRotate(!autoRotate)}>{autoRotate ? t("暫停輪播", "Pause rotation") : t("自動輪播", "Auto rotate")}</button></div>
          </>}
          <div className="interchange-viewport" role="region" aria-label={t("車站到站屏", "Station arrival displays")}
            onMouseEnter={() => setRotationPaused(true)} onMouseLeave={() => setRotationPaused(false)}
            onTouchStart={(event) => { touchStartRef.current = event.touches[0]?.clientX ?? null; setRotationPaused(true); }}
            onTouchEnd={(event) => {
              const end = event.changedTouches[0]?.clientX;
              if (touchStartRef.current !== null && end !== undefined && displayGroups.length > 1 && Math.abs(end - touchStartRef.current) > 55) {
                setGroupIndex((index) => (index + (end < touchStartRef.current! ? 1 : -1) + displayGroups.length) % displayGroups.length);
                setAutoRotate(false);
              }
              touchStartRef.current = null;
              setRotationPaused(false);
            }}>
            <div className="interchange-track" style={{ transform: `translateX(-${groupIndex * 100}%)` }}>
              {displayGroups.map((group, index) => <section key={group.id} className="interchange-slide" aria-hidden={index !== groupIndex}>
                {group.stations.length > 1 && <div className="interchange-caption"><strong>{stationName(group)}</strong><span>{language === "tc" ? group.descriptionTc : group.descriptionEn}</span></div>}
                <div className={`interchange-boards${group.stations.length > 1 ? " multi-line-boards" : ""}`}>{group.stations.map(renderBoard)}</div>
              </section>)}
            </div>
          </div>
          <div className="board-meta">
            <span className="live-pill" role="status" aria-live="polite"><i className={`status-dot${verified ? " live" : waiting ? " loading" : " error"}`} aria-hidden="true" />{statusText}</span>
            <span className="source-clock"><span className="meta-label">{t("官方資料每 10 秒更新 · 倒計時每秒計算", "Official feed every 10s · countdown updated every second")}</span></span>
          </div>
          <details className="data-note">
            <summary>{t("關於到站時間", "About arrival times")}</summary>
            <p>{t("列車列表只顯示已核實的官方預報：目的地、月台和香港時間均須有效，已過預計時間的班次會移除。「即將抵達」表示預計在 60 秒內到站，不代表已實際進站；官方開出時間仍以分鐘顯示，並標示「預計開出」。官方資料每 10 秒更新，本站以相同頻率讀取；畫面每秒計算剩餘時間。資料超過 45 秒、請求失敗或無法驗證時，該綫列車列表會隱藏，提示顯示在列表外。", "Only verified official forecasts appear: destination, platform and Hong Kong timestamp must be valid; elapsed forecasts are removed. “Arriving” estimates arrival within 60 seconds, not physical entry. Official departure forecasts retain minutes and the “Departs” label. MTR updates its feed every 10 seconds; requests follow this interval while countdowns advance each second. Failed, unverifiable or over-45-second-old data hides that line's train list, with the explanation outside the list.")}</p>
          </details>
        </>
      )}
      <footer className="site-footer"><span>{t("非港鐵官方網站", "Unofficial website")} · MTR Live</span><a className="source-link" href="https://data.gov.hk/en-data/dataset/mtr-data2-nexttrain-data" target="_blank" rel="noopener noreferrer">{t("官方數據來源 ↗", "Official data source ↗")}</a></footer>
    </main>
  );
}

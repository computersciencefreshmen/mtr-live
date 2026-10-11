"use client";

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { DEFAULT_STATION_KEY, findStation, LINE_CODES, LINES, STATIONS, type LineCode, type StationKey } from "../lib/mtr-stations";

type StationChooserProps = {
  station: StationKey;
  language: "tc" | "en";
  onChoose: (key: StationKey) => void;
};

const normalize = (value: string) => value.toLocaleLowerCase().replace(/[\s_-]+/g, "");

export default function StationChooser({ station, language, onChoose }: StationChooserProps) {
  const current = findStation(station) ?? findStation(DEFAULT_STATION_KEY)!;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [lineFilter, setLineFilter] = useState<LineCode | "all">("all");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const focusFrameRef = useRef<number | null>(null);
  const backdropPointerRef = useRef(false);
  const id = useId();
  const titleId = `${id}-title`;
  const descriptionId = `${id}-description`;
  const searchId = `${id}-search`;
  const t = (tc: string, en: string) => language === "tc" ? tc : en;
  const currentName = language === "tc" ? current.nameTc : current.nameEn;

  const results = useMemo(() => {
    const search = normalize(query);
    return STATIONS.filter((item) => {
      if (lineFilter !== "all" && item.line !== lineFilter) return false;
      return !search || [item.nameTc, item.nameEn, item.code, item.key, LINES[item.line].nameTc, LINES[item.line].nameEn]
        .some((value) => normalize(value).includes(search));
    }).sort((a, b) => Number(b.key === station) - Number(a.key === station));
  }, [query, lineFilter, station]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    const previousPadding = document.body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    const bodyPadding = Number.parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    if (scrollbar > 0) document.body.style.paddingRight = `${bodyPadding + scrollbar}px`;
    const viewport = window.visualViewport;
    const updateViewport = () => {
      const height = viewport?.height ?? window.innerHeight;
      const bottom = viewport ? Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop) : 0;
      dialog.style.setProperty("--chooser-viewport-height", `${height}px`);
      dialog.style.setProperty("--chooser-viewport-bottom", `${bottom}px`);
      dialog.dataset.compact = String(height < 500);
    };
    updateViewport();
    viewport?.addEventListener("resize", updateViewport);
    viewport?.addEventListener("scroll", updateViewport);
    window.addEventListener("resize", updateViewport);
    if (!dialog.open) dialog.showModal();
    const focusFrame = window.requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
      if (resultsRef.current) resultsRef.current.scrollTop = 0;
      if (filtersRef.current) filtersRef.current.scrollLeft = 0;
    });
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
      document.body.style.paddingRight = previousPadding;
      viewport?.removeEventListener("resize", updateViewport);
      viewport?.removeEventListener("scroll", updateViewport);
      window.removeEventListener("resize", updateViewport);
      dialog.style.removeProperty("--chooser-viewport-height");
      dialog.style.removeProperty("--chooser-viewport-bottom");
      delete dialog.dataset.compact;
    };
  }, [open]);

  useEffect(() => () => {
    if (focusFrameRef.current !== null) window.cancelAnimationFrame(focusFrameRef.current);
  }, []);

  const finishClose = () => {
    setOpen(false);
    backdropPointerRef.current = false;
    if (focusFrameRef.current !== null) window.cancelAnimationFrame(focusFrameRef.current);
    focusFrameRef.current = window.requestAnimationFrame(() => {
      triggerRef.current?.focus({ preventScroll: true });
      focusFrameRef.current = null;
    });
  };

  const close = () => {
    if (dialogRef.current?.open) dialogRef.current.close();
    else finishClose();
  };

  const openChooser = () => {
    setQuery("");
    setLineFilter("all");
    setOpen(true);
  };

  const outsideDialog = (clientX: number, clientY: number) => {
    const rect = dialogRef.current?.getBoundingClientRect();
    return !!rect && (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom);
  };

  return (
    <>
      <button
        type="button"
        className="station-chooser-trigger"
        ref={triggerRef}
        aria-haspopup="dialog"
        aria-controls={id}
        aria-expanded={open}
        aria-label={`${t("切換車站，現時車站：", "Change station. Current station: ")}${currentName}`}
        onClick={openChooser}
      >
        <span><small>{t("切換車站", "Change station")}</small><strong>{currentName}</strong></span>
        <svg viewBox="0 0 20 20" width="17" height="17" fill="none" aria-hidden="true"><path d="m5 7.5 5 5 5-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      <dialog
        className="station-dialog"
        id={id}
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        onClose={finishClose}
        onPointerDown={(event) => {
          backdropPointerRef.current = event.target === event.currentTarget && outsideDialog(event.clientX, event.clientY);
        }}
        onClick={(event) => {
          if (backdropPointerRef.current && event.target === event.currentTarget && outsideDialog(event.clientX, event.clientY)) close();
          backdropPointerRef.current = false;
        }}
      >
        <div className="chooser-surface">
          <div className="chooser-handle" aria-hidden="true" />
          <header className="chooser-header">
            <div><h2 id={titleId}>{t("選擇車站", "Choose a station")}</h2><p id={descriptionId}>{t("搜尋站名或代碼，亦可按路綫篩選。", "Search by name or code, or filter by line.")}</p></div>
            <button type="button" className="chooser-close" aria-label={t("關閉選站", "Close station chooser")} onClick={close}><svg viewBox="0 0 20 20" width="19" height="19" fill="none" aria-hidden="true"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg></button>
          </header>
          <div className="chooser-search">
            <label className="chooser-search-label" htmlFor={searchId}>{t("車站名稱或代碼", "Station name or code")}</label>
            <div className="chooser-search-field">
              <svg viewBox="0 0 20 20" width="20" height="20" fill="none" aria-hidden="true"><circle cx="8.5" cy="8.5" r="5.5" stroke="currentColor" strokeWidth="1.5" /><path d="m12.5 12.5 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
              <input ref={inputRef} type="search" id={searchId} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t("例如：海洋公園、Ocean Park、OCP", "e.g. Ocean Park, 海洋公園, OCP")} autoComplete="off" autoCapitalize="none" spellCheck={false} />
              {query && <button type="button" className="chooser-clear" aria-label={t("清除搜尋", "Clear search")} onClick={() => { setQuery(""); inputRef.current?.focus(); }}>×</button>}
            </div>
          </div>
          <div className="chooser-line-filters" ref={filtersRef} role="group" aria-label={t("按路綫篩選", "Filter by line")}>
            <button type="button" className="chooser-line-filter" aria-pressed={lineFilter === "all"} onClick={() => setLineFilter("all")}>{t("全部路綫", "All lines")}</button>
            {LINE_CODES.map((code) => <button type="button" className="chooser-line-filter" style={{ "--line-color": LINES[code].color } as CSSProperties} key={code} aria-pressed={lineFilter === code} onClick={() => setLineFilter(code)}><i aria-hidden="true" />{language === "tc" ? LINES[code].nameTc : LINES[code].nameEn}</button>)}
          </div>
          <p className="chooser-count" aria-live="polite">{t(`${results.length} 個結果`, `${results.length} results`)}</p>
          <div className="chooser-results" ref={resultsRef} aria-label={t("可選車站", "Available stations")}>
            {results.length ? results.map((item) => {
              const active = item.key === station;
              return <button type="button" className="chooser-station" aria-current={active ? "location" : undefined} key={item.key} onClick={() => { close(); onChoose(item.key); }}>
                <span className="chooser-station-names"><strong>{language === "tc" ? item.nameTc : item.nameEn}</strong><small>{language === "tc" ? item.nameEn : item.nameTc} · {item.code}</small></span>
                <span className="line-chip" style={{ "--line-color": LINES[item.line].color } as CSSProperties}>{language === "tc" ? LINES[item.line].nameTc : LINES[item.line].nameEn}</span>
                <span className="chooser-check" aria-hidden="true">{active ? "✓" : ""}</span>
              </button>;
            }) : <div className="chooser-no-results"><strong>{t("找不到車站", "No stations found")}</strong><p>{t("試試其他站名、代碼，或選擇「全部路綫」。", "Try another name or code, or choose “All lines”.")}</p></div>}
          </div>
        </div>
      </dialog>
    </>
  );
}

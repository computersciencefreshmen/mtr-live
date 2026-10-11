import { findStation, LINES, STATIONS, type Station, type StationKey } from "./mtr-stations";

export type DisplayGroup = {
  id: string;
  nameTc: string;
  nameEn: string;
  descriptionTc: string;
  descriptionEn: string;
  stations: Station[];
};

function group(
  id: string,
  stations: Station[],
  descriptionTc: string,
  descriptionEn: string,
): DisplayGroup {
  return {
    id,
    nameTc: stations.map((station) => LINES[station.line].nameTc).join(" · "),
    nameEn: stations.map((station) => LINES[station.line].nameEn).join(" · "),
    descriptionTc,
    descriptionEn,
    stations,
  };
}

/**
 * Groups one physical station's official line-specific feeds for display.
 * Admiralty's platform groupings follow the official October 2025 layout:
 * https://www.mtr.com.hk/archive/ch/services/layouts/adm.pdf
 * Platform numbers for individual trains must still come from each live record.
 */
export function getDisplayGroups(key: StationKey): DisplayGroup[] {
  const selected = findStation(key);
  if (!selected) return [];

  if (selected.code === "ADM") {
    const existing = [findStation("TWL-ADM"), findStation("ISL-ADM")]
      .filter((station): station is Station => station !== undefined);
    const expanded = [findStation("SIL-ADM"), findStation("EAL-ADM")]
      .filter((station): station is Station => station !== undefined);
    return [
      group("ADM-platforms-1-4", existing,
        "1–4 號月台 · L2–L3", "Platforms 1–4 · L2–L3"),
      group("ADM-platforms-5-8", expanded,
        "5–8 號月台 · L5–L6", "Platforms 5–8 · L5–L6"),
    ];
  }

  // Sharing a station code is required. Walking connections such as TST/ETS
  // are separate stations and must not be merged into this board.
  const stations = STATIONS.filter((station) => station.code === selected.code);
  const interchange = stations.length > 1;
  return [group(`${selected.code}-all-lines`, stations,
    interchange ? "轉車站各綫到站資料" : "官方實時到站資料",
    interchange ? "Live train information for all lines at this interchange" : "Official live train information",
  )];
}

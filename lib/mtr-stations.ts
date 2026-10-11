/**
 * MTR official Next Train station registry, verified 2026-10-11.
 * Supported line/sta combinations: Next_Train_DataDictionary_v1.7.pdf (2025-03-13).
 * Names/order: mtr_lines_and_stations.csv plus the official MTR system map (RAC).
 * https://opendata.mtr.com.hk/doc/Next_Train_DataDictionary_v1.7.pdf
 * https://opendata.mtr.com.hk/data/mtr_lines_and_stations.csv
 * https://www.mtr.com.hk/ch/customer/services/system_map.html
 * This registry contains public metadata only, never simulated train schedules.
 * Light Rail uses a different API and is deliberately outside this registry.
 */

export const LINE_CODES = ["SIL", "ISL", "TWL", "KTL", "TKL", "TML", "EAL", "TCL", "AEL", "DRL"] as const;
export type LineCode = (typeof LINE_CODES)[number];

export const STATION_NAMES = {
  ADM: {"nameTc": "金鐘", "nameEn": "Admiralty"},
  AIR: {"nameTc": "機場", "nameEn": "Airport"},
  AUS: {"nameTc": "柯士甸", "nameEn": "Austin"},
  AWE: {"nameTc": "博覽館", "nameEn": "AsiaWorld-Expo"},
  CAB: {"nameTc": "銅鑼灣", "nameEn": "Causeway Bay"},
  CEN: {"nameTc": "中環", "nameEn": "Central"},
  CHH: {"nameTc": "彩虹", "nameEn": "Choi Hung"},
  CHW: {"nameTc": "柴灣", "nameEn": "Chai Wan"},
  CIO: {"nameTc": "第一城", "nameEn": "City One"},
  CKT: {"nameTc": "車公廟", "nameEn": "Che Kung Temple"},
  CSW: {"nameTc": "長沙灣", "nameEn": "Cheung Sha Wan"},
  DIH: {"nameTc": "鑽石山", "nameEn": "Diamond Hill"},
  DIS: {"nameTc": "迪士尼", "nameEn": "Disneyland Resort"},
  ETS: {"nameTc": "尖東", "nameEn": "East Tsim Sha Tsui"},
  EXC: {"nameTc": "會展", "nameEn": "Exhibition Centre"},
  FAN: {"nameTc": "粉嶺", "nameEn": "Fanling"},
  FOH: {"nameTc": "炮台山", "nameEn": "Fortress Hill"},
  FOT: {"nameTc": "火炭", "nameEn": "Fo Tan"},
  HAH: {"nameTc": "坑口", "nameEn": "Hang Hau"},
  HEO: {"nameTc": "恆安", "nameEn": "Heng On"},
  HFC: {"nameTc": "杏花邨", "nameEn": "Heng Fa Chuen"},
  HIK: {"nameTc": "顯徑", "nameEn": "Hin Keng"},
  HKU: {"nameTc": "香港大學", "nameEn": "HKU"},
  HOK: {"nameTc": "香港", "nameEn": "Hong Kong"},
  HOM: {"nameTc": "何文田", "nameEn": "Ho Man Tin"},
  HUH: {"nameTc": "紅磡", "nameEn": "Hung Hom"},
  JOR: {"nameTc": "佐敦", "nameEn": "Jordan"},
  KAT: {"nameTc": "啟德", "nameEn": "Kai Tak"},
  KET: {"nameTc": "堅尼地城", "nameEn": "Kennedy Town"},
  KOB: {"nameTc": "九龍灣", "nameEn": "Kowloon Bay"},
  KOT: {"nameTc": "九龍塘", "nameEn": "Kowloon Tong"},
  KOW: {"nameTc": "九龍", "nameEn": "Kowloon"},
  KSR: {"nameTc": "錦上路", "nameEn": "Kam Sheung Road"},
  KWF: {"nameTc": "葵芳", "nameEn": "Kwai Fong"},
  KWH: {"nameTc": "葵興", "nameEn": "Kwai Hing"},
  KWT: {"nameTc": "觀塘", "nameEn": "Kwun Tong"},
  LAK: {"nameTc": "荔景", "nameEn": "Lai King"},
  LAT: {"nameTc": "藍田", "nameEn": "Lam Tin"},
  LCK: {"nameTc": "荔枝角", "nameEn": "Lai Chi Kok"},
  LET: {"nameTc": "利東", "nameEn": "Lei Tung"},
  LHP: {"nameTc": "康城", "nameEn": "LOHAS Park"},
  LMC: {"nameTc": "落馬洲", "nameEn": "Lok Ma Chau"},
  LOF: {"nameTc": "樂富", "nameEn": "Lok Fu"},
  LOP: {"nameTc": "朗屏", "nameEn": "Long Ping"},
  LOW: {"nameTc": "羅湖", "nameEn": "Lo Wu"},
  MEF: {"nameTc": "美孚", "nameEn": "Mei Foo"},
  MKK: {"nameTc": "旺角東", "nameEn": "Mong Kok East"},
  MOK: {"nameTc": "旺角", "nameEn": "Mong Kok"},
  MOS: {"nameTc": "馬鞍山", "nameEn": "Ma On Shan"},
  NAC: {"nameTc": "南昌", "nameEn": "Nam Cheong"},
  NOP: {"nameTc": "北角", "nameEn": "North Point"},
  NTK: {"nameTc": "牛頭角", "nameEn": "Ngau Tau Kok"},
  OCP: {"nameTc": "海洋公園", "nameEn": "Ocean Park"},
  OLY: {"nameTc": "奧運", "nameEn": "Olympic"},
  POA: {"nameTc": "寶琳", "nameEn": "Po Lam"},
  PRE: {"nameTc": "太子", "nameEn": "Prince Edward"},
  QUB: {"nameTc": "鰂魚涌", "nameEn": "Quarry Bay"},
  RAC: {"nameTc": "馬場", "nameEn": "Racecourse"},
  SHM: {"nameTc": "石門", "nameEn": "Shek Mun"},
  SHS: {"nameTc": "上水", "nameEn": "Sheung Shui"},
  SHT: {"nameTc": "沙田", "nameEn": "Sha Tin"},
  SHW: {"nameTc": "上環", "nameEn": "Sheung Wan"},
  SIH: {"nameTc": "兆康", "nameEn": "Siu Hong"},
  SKM: {"nameTc": "石硤尾", "nameEn": "Shek Kip Mei"},
  SKW: {"nameTc": "筲箕灣", "nameEn": "Shau Kei Wan"},
  SOH: {"nameTc": "海怡半島", "nameEn": "South Horizons"},
  SSP: {"nameTc": "深水埗", "nameEn": "Sham Shui Po"},
  STW: {"nameTc": "沙田圍", "nameEn": "Sha Tin Wai"},
  SUN: {"nameTc": "欣澳", "nameEn": "Sunny Bay"},
  SUW: {"nameTc": "宋皇臺", "nameEn": "Sung Wong Toi"},
  SWH: {"nameTc": "西灣河", "nameEn": "Sai Wan Ho"},
  SYP: {"nameTc": "西營盤", "nameEn": "Sai Ying Pun"},
  TAK: {"nameTc": "太古", "nameEn": "Tai Koo"},
  TAP: {"nameTc": "大埔墟", "nameEn": "Tai Po Market"},
  TAW: {"nameTc": "大圍", "nameEn": "Tai Wai"},
  TIH: {"nameTc": "天后", "nameEn": "Tin Hau"},
  TIK: {"nameTc": "調景嶺", "nameEn": "Tiu Keng Leng"},
  TIS: {"nameTc": "天水圍", "nameEn": "Tin Shui Wai"},
  TKO: {"nameTc": "將軍澳", "nameEn": "Tseung Kwan O"},
  TKW: {"nameTc": "土瓜灣", "nameEn": "To Kwa Wan"},
  TSH: {"nameTc": "大水坑", "nameEn": "Tai Shui Hang"},
  TST: {"nameTc": "尖沙咀", "nameEn": "Tsim Sha Tsui"},
  TSW: {"nameTc": "荃灣", "nameEn": "Tsuen Wan"},
  TSY: {"nameTc": "青衣", "nameEn": "Tsing Yi"},
  TUC: {"nameTc": "東涌", "nameEn": "Tung Chung"},
  TUM: {"nameTc": "屯門", "nameEn": "Tuen Mun"},
  TWH: {"nameTc": "大窩口", "nameEn": "Tai Wo Hau"},
  TWO: {"nameTc": "太和", "nameEn": "Tai Wo"},
  TWW: {"nameTc": "荃灣西", "nameEn": "Tsuen Wan West"},
  UNI: {"nameTc": "大學", "nameEn": "University"},
  WAC: {"nameTc": "灣仔", "nameEn": "Wan Chai"},
  WCH: {"nameTc": "黃竹坑", "nameEn": "Wong Chuk Hang"},
  WHA: {"nameTc": "黃埔", "nameEn": "Whampoa"},
  WKS: {"nameTc": "烏溪沙", "nameEn": "Wu Kai Sha"},
  WTS: {"nameTc": "黃大仙", "nameEn": "Wong Tai Sin"},
  YAT: {"nameTc": "油塘", "nameEn": "Yau Tong"},
  YMT: {"nameTc": "油麻地", "nameEn": "Yau Ma Tei"},
  YUL: {"nameTc": "元朗", "nameEn": "Yuen Long"},
} as const;

export type StationCode = keyof typeof STATION_NAMES;
export type StationKey = `${LineCode}-${StationCode}`;
export type Direction = 'UP' | 'DOWN';

export type Station = {
  key: StationKey;
  line: LineCode;
  code: StationCode;
  nameTc: string;
  nameEn: string;
};

export type LineDefinition = {
  code: LineCode;
  nameTc: string;
  nameEn: string;
  color: string;
  /** UP order; branches appear beside their junction and must not be treated as a single route. */
  stations: readonly StationCode[];
  upDestinations: readonly StationCode[];
  downDestinations: readonly StationCode[];
};

export const LINES: Record<LineCode, LineDefinition> = {
  SIL: { code: "SIL", nameTc: "南港島綫", nameEn: "South Island Line", color: "#B5BD00",
    stations: ["ADM", "OCP", "WCH", "LET", "SOH"],
    upDestinations: ["SOH"], downDestinations: ["ADM"] },
  ISL: { code: "ISL", nameTc: "港島綫", nameEn: "Island Line", color: "#0075BE",
    stations: ["KET", "HKU", "SYP", "SHW", "CEN", "ADM", "WAC", "CAB", "TIH", "FOH", "NOP", "QUB", "TAK", "SWH", "SKW", "HFC", "CHW"],
    upDestinations: ["CHW"], downDestinations: ["KET"] },
  TWL: { code: "TWL", nameTc: "荃灣綫", nameEn: "Tsuen Wan Line", color: "#E2231A",
    stations: ["CEN", "ADM", "TST", "JOR", "YMT", "MOK", "PRE", "SSP", "CSW", "LCK", "MEF", "LAK", "KWF", "KWH", "TWH", "TSW"],
    upDestinations: ["TSW"], downDestinations: ["CEN"] },
  KTL: { code: "KTL", nameTc: "觀塘綫", nameEn: "Kwun Tong Line", color: "#00AB4E",
    stations: ["WHA", "HOM", "YMT", "MOK", "PRE", "SKM", "KOT", "LOF", "WTS", "DIH", "CHH", "KOB", "NTK", "KWT", "LAT", "YAT", "TIK"],
    upDestinations: ["TIK"], downDestinations: ["WHA"] },
  TKL: { code: "TKL", nameTc: "將軍澳綫", nameEn: "Tseung Kwan O Line", color: "#6B208B",
    stations: ["NOP", "QUB", "YAT", "TIK", "TKO", "LHP", "HAH", "POA"],
    upDestinations: ["POA", "LHP"], downDestinations: ["TIK", "NOP"] },
  TML: { code: "TML", nameTc: "屯馬綫", nameEn: "Tuen Ma Line", color: "#9A3820",
    stations: ["WKS", "MOS", "HEO", "TSH", "SHM", "CIO", "STW", "CKT", "TAW", "HIK", "DIH", "KAT", "SUW", "TKW", "HOM", "HUH", "ETS", "AUS", "NAC", "MEF", "TWW", "KSR", "YUL", "LOP", "TIS", "SIH", "TUM"],
    upDestinations: ["TUM"], downDestinations: ["WKS"] },
  EAL: { code: "EAL", nameTc: "東鐵綫", nameEn: "East Rail Line", color: "#53B7E8",
    stations: ["ADM", "EXC", "HUH", "MKK", "KOT", "TAW", "SHT", "FOT", "RAC", "UNI", "TAP", "TWO", "FAN", "SHS", "LOW", "LMC"],
    upDestinations: ["LMC", "LOW", "SHS", "TAP", "RAC", "FOT", "SHT"], downDestinations: ["ADM", "HUH", "MKK"] },
  TCL: { code: "TCL", nameTc: "東涌綫", nameEn: "Tung Chung Line", color: "#F38B00",
    stations: ["HOK", "KOW", "OLY", "NAC", "LAK", "TSY", "SUN", "TUC"],
    upDestinations: ["TUC"], downDestinations: ["HOK"] },
  AEL: { code: "AEL", nameTc: "機場快綫", nameEn: "Airport Express", color: "#00888A",
    stations: ["HOK", "KOW", "TSY", "AIR", "AWE"],
    upDestinations: ["AIR", "AWE"], downDestinations: ["HOK"] },
  DRL: { code: "DRL", nameTc: "迪士尼綫", nameEn: "Disneyland Resort Line", color: "#F550A6",
    stations: ["DIS", "SUN"],
    upDestinations: ["SUN"], downDestinations: ["DIS"] },
};

export const LINE_LIST: readonly LineDefinition[] = LINE_CODES.map((code) => LINES[code]);

export const STATIONS: readonly Station[] = LINE_CODES.flatMap((line) =>
  LINES[line].stations.map((code) => ({
    key: `${line}-${code}` as StationKey,
    line,
    code,
    ...STATION_NAMES[code],
  })),
);

export const STATION_BY_KEY: Readonly<Record<string, Station>> = Object.fromEntries(
  STATIONS.map((station) => [station.key, station]),
);

/** Multiple line entries for an interchange are retained deliberately. */
export const stationToLines: Readonly<Record<StationCode, readonly LineCode[]>> = (
  Object.keys(STATION_NAMES) as StationCode[]
).reduce<Record<StationCode, readonly LineCode[]>>((result, code) => {
  result[code] = LINE_CODES.filter((line) => LINES[line].stations.includes(code));
  return result;
}, {} as Record<StationCode, readonly LineCode[]>);

export const DEFAULT_STATION_KEY: StationKey = 'SIL-OCP';
export const API_STATION_COUNT = STATIONS.length;
export const UNIQUE_STATION_COUNT = Object.keys(STATION_NAMES).length;

export function isLineCode(value: string): value is LineCode {
  return (LINE_CODES as readonly string[]).includes(value);
}

/** Validates the actual line/station pair, rather than either code in isolation. */
export function findStation(key: string): Station | undefined {
  return STATION_BY_KEY[key.trim().toUpperCase()];
}

export function getStationName(code: string): { nameTc: string; nameEn: string } {
  const normalized = code.trim().toUpperCase();
  return STATION_NAMES[normalized as StationCode] ?? { nameTc: normalized, nameEn: normalized };
}

export function stationsForLine(line: LineCode): Station[] {
  return STATIONS.filter((station) => station.line === line);
}

export function linesForStation(code: StationCode): readonly LineCode[] {
  return stationToLines[code];
}

/** Direction names describe destinations; available services always come from the live API. */
export function directionDestinations(line: LineCode, direction: Direction): readonly StationCode[] {
  return direction === 'UP' ? LINES[line].upDestinations : LINES[line].downDestinations;
}

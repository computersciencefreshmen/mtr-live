# MTR Live · 港鐵實時到站

An independent arrival-board website using the official MTR Next Train API. It retains the station-screen interface and runs as a standard Next.js application, with a same-origin server endpoint at `/api/next-train`.

## Features and coverage

- Ocean Park (`SIL-OCP`) is the default resident station. Save another resident station in the browser, search stations, or open a randomly selected station.
- Traditional Chinese and English interfaces, with official destinations, platform numbers, forecast times, and upcoming-train sequence.
- All **10 railway lines supported by the MTR Next Train API**: Airport Express, Tung Chung, Tuen Ma, Tseung Kwan O, East Rail, South Island, Tsuen Wan, Island, Kwun Tong, and Disneyland Resort.
- **98 distinct stations and 121 supported line–station combinations**. A selected interchange shows all supported feeds for that physical station. Admiralty has two groups: Tsuen Wan/Island lines (platforms 1–4) and South Island/East Rail lines (platforms 5–8). The groups rotate every **12 seconds**, with swipe, manual group buttons, and a pause control. Light Rail, MTR buses, and High Speed Rail use different services and are outside this application’s coverage.
- Refreshes every **10 seconds** while viewing a station board, fetching only the selected station’s line-specific feeds rather than the entire network.
- The in-page station chooser supports Chinese, English, station codes, and line filters. It appears as a desktop dialog or a mobile bottom sheet, with keyboard focus handling and touch controls.

## Run locally

Use **Node.js 24** and npm. No API key, MTR account, database, or environment variable is required.

```sh
npm ci
npm run dev
```

Open `http://localhost:3000`.

For a production build:

```sh
npm run build
npm start
```

The browser calls `/api/next-train?line=SIL&sta=OCP`. The server validates the line–station pair and fetches the fixed official endpoint; it does not accept arbitrary upstream URLs.

To check the pure arrival filter:

```sh
node scripts/check-verified-arrivals.mjs
```

The script uses fixed examples only to test validation boundaries; it does not replace or mock the application’s live feed.

## Deploy on Vercel

For a local Codex handoff covering public GitHub publication, Vercel Git integration, production verification, and custom domains, follow [CODEX_DEPLOY.md](CODEX_DEPLOY.md).

1. Push this directory to a GitHub repository.
2. In Vercel, select **Add New → Project** and import that repository.
3. Use the **Next.js** framework preset and the repository root as the Root Directory.
4. Set the Node.js version to **24.x**. The normal build command is `npm run build`; no environment variables are needed.
5. Deploy. With the GitHub integration enabled, subsequent commits to the production branch can trigger a new deployment.

## Data accuracy

The sole train-data source is:

```text
https://rt.data.gov.hk/v1/transport/mtr/getSchedule.php
```

The application contains **no simulated, prerecorded, or alternative train feed**. If the official feed fails, returns a service alert, supplies an invalid timestamp, or exceeds the **45-second freshness window**, the live countdown stops and the interface reports the unavailable or stale data.

Forecast timestamps are parsed explicitly in Hong Kong time (`UTC+08:00`). Countdown timing uses the verified official timestamp and elapsed browser time rather than relying on the visitor’s wall clock. Responses use `no-store` caching directives.

Each direction is **filtered before taking its first two records**: the timestamp must be a real Hong Kong calendar date at or after the verified current time, the destination must belong to the same line, and the platform must be valid. Expired or malformed records are removed, so an old first forecast cannot block the next valid train. Empty or unverified directions have no train rows; a separate status message explains when no verified forecasts are available.

“即將抵達 / Arriving” is an **ETA-derived estimate within 60 seconds**, not confirmation that a train has physically entered the station. The official `timeType` field takes precedence over the older lowercase spelling. `D` records retain the forecast minute value with departure wording, and `route=RAC` identifies services via Racecourse. Unknown time types keep neutral forecast wording and are never guessed to be arriving; absent East Rail time types are also treated neutrally. Shared official platform strings such as `1/3` are retained. The API’s dummy fields `ttnt`, `valid`, and `source` are not used as authoritative arrival information.

Official references:

- [MTR train-information dataset and update frequency](https://data.gov.hk/en-data/dataset/mtr-data2-nexttrain-data)
- [Next Train API Specification v1.7](https://opendata.mtr.com.hk/doc/Next_Train_API_Spec_v1.7.pdf)
- [Next Train Data Dictionary v1.7](https://opendata.mtr.com.hk/doc/Next_Train_DataDictionary_v1.7.pdf)
- [Official line and station metadata](https://opendata.mtr.com.hk/data/mtr_lines_and_stations.csv)
- [MTR system map](https://www.mtr.com.hk/ch/customer/services/system_map.html)

The station registry was checked against these official sources on **11 October 2026**. API support can change; update the registry from official documentation when new stations or lines become available.

## MTR mark and affiliation

`public/assets/mtr-logo.png` is an unmodified **192 × 192** official MTR mark downloaded from [the MTR website’s original asset](https://www.mtr.com.hk/mtrmobile/lib/app/android-icon-192x192.png), referenced by its [Next Train page](https://www.mtr.com.hk/mtrmobile/en/transport/next-train/). It was not redrawn, generated, or cropped.

This is an **independent, unofficial project** and is not affiliated with, endorsed by, or operated by MTR Corporation. MTR names, marks, and official data belong to their respective owner. Publishing this application’s source does not grant rights to the MTR mark or third-party materials. For operational decisions, check MTR’s own announcements and station information.

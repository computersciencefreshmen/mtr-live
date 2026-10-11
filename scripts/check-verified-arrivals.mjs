import assert from "node:assert/strict";
import { registerHooks } from "node:module";

const helperUrl = new URL("../lib/verified-arrivals.ts", import.meta.url).href;
registerHooks({ resolve(specifier, context, nextResolve) {
  return context.parentURL === helperUrl && specifier === "./mtr-stations"
    ? nextResolve("./mtr-stations.ts", context)
    : nextResolve(specifier, context);
} });
const { getVerifiedTrains } = await import(helperUrl);
// Fixed examples test the pure filter's boundaries only. No API is mocked,
// and no sample record is connected to the application's live data source.
const now = Date.parse("2026-10-11T12:00:00+08:00");
const train = (time = "2026-10-11 12:01:00", dest = "SOH", plat = "1") => ({ time, dest, plat });
assert.deepEqual(getVerifiedTrains(null, now, "SIL"), []);
assert.deepEqual(getVerifiedTrains({}, now, "SIL"), []);
assert.deepEqual(getVerifiedTrains([train()], NaN, "SIL"), []);
assert.deepEqual(getVerifiedTrains([train()], now, "SIL", 0), []);
assert.deepEqual(getVerifiedTrains([train()], now, "SIL", Infinity), []);
const boundary = train("2026-10-11 12:00:00");
assert.equal(getVerifiedTrains([boundary], now, "SIL")[0].delta, 0);
assert.deepEqual(getVerifiedTrains([boundary], now + 1, "SIL"), []);
assert.equal(getVerifiedTrains([train("2026-10-11 12:00:01")], now + 999, "SIL")[0].delta, 1);
assert.deepEqual(getVerifiedTrains([
  null, "train", [], train("2026-10-11 11:59:59"), train(undefined, "HKU"),
  train("invalid"), { time: "2026-10-11 12:01:00", dest: "SOH" },
  train("2026-10-11 12:01:00", "SOH", "1"),
  train("2026-10-11 12:02:00", "ADM", 2),
  train("2026-10-11 12:03:00", "SOH", "1"),
], now, "SIL").map(({ dest, plat }) => ({ dest, plat })), [
  { dest: "SOH", plat: "1" }, { dest: "ADM", plat: "2" },
]);
const january = Date.parse("2026-01-01T00:00:00+08:00");
for (const invalid of ["2026-02-29 12:00:00", "2026-04-31 12:00:00", "2026-10-11 24:00:00", "2026-10-11 12:60:00", "2026-10-11 12:00:60", "2026-13-01 12:00:00"]) {
  assert.deepEqual(getVerifiedTrains([train(invalid)], january, "SIL"), [], invalid);
}
assert.equal(getVerifiedTrains([train("2024-02-29 12:00:00")], Date.parse("2024-02-29T11:59:59+08:00"), "SIL")[0].delta, 1_000);
assert.equal(getVerifiedTrains([train("2026-10-12 00:00:00")], Date.parse("2026-10-11T23:59:59+08:00"), "SIL")[0].delta, 1_000);
for (const invalid of [undefined, null, 0, -1, 1.5, NaN, "", "0", "1/0", "1 /3", "—", "platform 1"]) {
  assert.deepEqual(getVerifiedTrains([{ time: "2026-10-11 12:01:00", dest: "SOH", plat: invalid }], now, "SIL"), [], String(invalid));
}
assert.deepEqual(getVerifiedTrains([train(undefined, "HOK", "1/3"), train(undefined, "HOK", "2/4")], now, "AEL").map(({ plat }) => plat), ["1/3", "2/4"]);
const semantics = getVerifiedTrains([
  { ...train(undefined, "LOW"), timetype: "D", route: "RAC" },
  train(undefined, "LOW"),
  { ...train(undefined, "LOW"), timetype: "UNKNOWN" },
  { ...train(undefined, "LOW"), timetype: "" },
], now, "EAL", 4);
assert.deepEqual(semantics.map(({ timetype }) => timetype), ["D", undefined, "UNKNOWN", ""]);
const officialSemantics = getVerifiedTrains([
  { ...train(undefined, "LOW"), timeType: "A", timetype: "D" },
  { ...train(undefined, "LOW"), timeType: "D", timetype: "A" },
  { ...train(undefined, "LOW"), timeType: "UNKNOWN", timetype: "D" },
  { ...train(undefined, "LOW"), timeType: "", timetype: "D" },
  { ...train(undefined, "LOW"), timeType: null, timetype: "D" },
], now, "EAL", 5);
assert.deepEqual(officialSemantics.map(({ timetype }) => timetype), ["A", "D", "UNKNOWN", "", undefined]);
assert.equal(semantics[0].route, "RAC");
console.log("Verified-arrival filter checks passed: invalid rows, real calendar dates, millisecond expiry, midnight, same-line destinations, shared platforms, order/limit and unchanged A/D semantics.");

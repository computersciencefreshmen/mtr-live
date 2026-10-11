import { getNextTrain } from "../../../lib/next-train";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
export const maxDuration = 15;

export async function GET(request: Request) {
  return getNextTrain(request);
}

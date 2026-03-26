import { NextResponse } from "next/server";

import { readDeviceErrors } from "../device-store";
import { ensureDeviceTelemetryListener } from "../device-telemetry";

export async function GET() {
  await ensureDeviceTelemetryListener();
  const errors = await readDeviceErrors();
  return NextResponse.json({ errors });
}

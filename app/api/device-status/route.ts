import { NextResponse } from "next/server";

import { readDeviceStatus, writeDeviceStatus } from "../device-store";
import { ensureDeviceTelemetryListener } from "../device-telemetry";

function formatUptime(raw: string) {
  const numeric = Number(raw);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return raw;
  }

  let remaining = Math.floor(numeric);
  const days = Math.floor(remaining / 86400);
  remaining %= 86400;
  const hours = Math.floor(remaining / 3600);
  remaining %= 3600;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || parts.length > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);

  return parts.join(" ");
}

export async function GET() {
  await ensureDeviceTelemetryListener();
  const status = await readDeviceStatus();
  const normalizedStatus = {
    ...status,
    uptime: formatUptime(status.uptime),
  };

  if (normalizedStatus.uptime !== status.uptime) {
    await writeDeviceStatus(normalizedStatus);
  }

  return NextResponse.json(normalizedStatus);
}


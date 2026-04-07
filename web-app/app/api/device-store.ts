import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

export type DeviceStatus = {
  temperature: string;
  uptime: string;
  wifiRssi: string;
  updatedAt: string | null;
};

export type DeviceErrorEntry = {
  id: string;
  message: string;
  source: string;
  level: string;
  timestamp: string;
};

const DATA_DIR = path.join(process.cwd(), "data");
const STATUS_FILE = path.join(DATA_DIR, "device-status.json");
const ERRORS_FILE = path.join(DATA_DIR, "device-errors.json");
const DEFAULT_STATUS: DeviceStatus = {
  temperature: "-- deg C",
  uptime: "0s",
  wifiRssi: "-- dBm",
  updatedAt: null,
};
const MAX_ERROR_ENTRIES = 100;

async function ensureDataDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJsonFile(filePath: string, data: unknown) {
  await ensureDataDir();
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function readDeviceStatus() {
  return readJsonFile<DeviceStatus>(STATUS_FILE, DEFAULT_STATUS);
}

export async function writeDeviceStatus(status: DeviceStatus) {
  await writeJsonFile(STATUS_FILE, status);
}

export async function updateDeviceStatus(partial: Partial<DeviceStatus>) {
  const current = await readDeviceStatus();
  const next: DeviceStatus = {
    ...current,
    ...partial,
    updatedAt: new Date().toISOString(),
  };
  await writeDeviceStatus(next);
  return next;
}

export async function readDeviceErrors() {
  return readJsonFile<DeviceErrorEntry[]>(ERRORS_FILE, []);
}

export async function appendDeviceErrors(entries: DeviceErrorEntry[]) {
  const existing = await readDeviceErrors();
  const next = [...entries, ...existing].slice(0, MAX_ERROR_ENTRIES);
  await writeJsonFile(ERRORS_FILE, next);
  return next;
}



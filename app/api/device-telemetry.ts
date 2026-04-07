import mqtt from "mqtt";

import { appendDeviceErrors, updateDeviceStatus } from "./device-store";

const BROKER_URL = "mqtt://broker.hivemq.com:1883";
const TOPIC_GLOBE_TELEM_CPUTEMP = "/trackpointai/globe/telem/cputemp";
const TOPIC_GLOBE_TELEM_UPTIME = "/trackpointai/globe/telem/uptime";
const TOPIC_GLOBE_TELEM_WIFI_RSSI = "/trackpointai/globe/telem/wifirssi";
const TOPIC_GLOBE_TELEM_ERRORS = "/trackpointai/globe/telem/errors";

let telemetryClient: mqtt.MqttClient | null = null;
let telemetryConnectPromise: Promise<void> | null = null;

function normalizePayload(payload: Buffer) {
  return payload.toString("utf8").trim();
}

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

function parseErrorPayload(raw: string) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    message: raw || "Unknown device error",
    source: "device",
    level: "error",
    timestamp: new Date().toISOString(),
  };
}

async function handleTelemetryMessage(topic: string, payload: Buffer) {
  const raw = normalizePayload(payload);

  if (topic === TOPIC_GLOBE_TELEM_CPUTEMP) {
    if (!raw) {
      return;
    }
    const numeric = Number(raw);
    const temperature = Number.isFinite(numeric) ? `${numeric} deg C` : raw || "-- deg C";
    await updateDeviceStatus({ temperature });
    return;
  }

  if (topic === TOPIC_GLOBE_TELEM_UPTIME) {
    if (!raw) {
      return;
    }
    await updateDeviceStatus({ uptime: formatUptime(raw) });
    return;
  }

  if (topic === TOPIC_GLOBE_TELEM_WIFI_RSSI) {
    if (!raw) {
      return;
    }
    const numeric = Number(raw);
    const wifiRssi = Number.isFinite(numeric) ? `${numeric} dBm` : raw || "-- dBm";
    await updateDeviceStatus({ wifiRssi });
    return;
  }

  if (topic === TOPIC_GLOBE_TELEM_ERRORS) {
    await appendDeviceErrors([parseErrorPayload(raw)]);
  }
}

export async function ensureDeviceTelemetryListener() {
  if (telemetryClient?.connected) {
    return;
  }

  if (telemetryConnectPromise) {
    return telemetryConnectPromise;
  }

  telemetryConnectPromise = new Promise<void>((resolve, reject) => {
    const client = mqtt.connect(BROKER_URL);
    telemetryClient = client;

    const topics = [
      TOPIC_GLOBE_TELEM_CPUTEMP,
      TOPIC_GLOBE_TELEM_UPTIME,
      TOPIC_GLOBE_TELEM_WIFI_RSSI,
      TOPIC_GLOBE_TELEM_ERRORS,
    ];

    const cleanup = () => {
      client.off("connect", handleConnect);
      client.off("error", handleError);
    };

    const handleConnect = () => {
      client.subscribe(topics, { qos: 1 }, (error) => {
        if (error) {
          cleanup();
          telemetryConnectPromise = null;
          reject(error);
          return;
        }

        cleanup();
        telemetryConnectPromise = null;
        resolve();
      });
    };

    const handleError = (error: Error) => {
      cleanup();
      telemetryConnectPromise = null;
      telemetryClient = null;
      client.end(true);
      reject(error);
    };

    client.once("connect", handleConnect);
    client.once("error", handleError);
    client.on("close", () => {
      telemetryClient = null;
    });
    client.on("message", (topic, message) => {
      void handleTelemetryMessage(topic, message);
    });
  });

  return telemetryConnectPromise;
}

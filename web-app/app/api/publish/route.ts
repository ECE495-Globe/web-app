import mqtt from "mqtt";

const BROKER_URL = "mqtt://broker.hivemq.com:1883";

type PublishPayload = {
  source?: string;
  speed?: number;
  direction?: number;
  volume?: number;
  haptic?: number;
};

type ControlKey = "speed" | "direction" | "volume" | "haptic";
type LastControlState = Partial<Record<ControlKey, number>>;

let mqttClient: mqtt.MqttClient | null = null;
let connectPromise: Promise<mqtt.MqttClient> | null = null;
let lastPublishedState: LastControlState = {};
let lastPublishedSource: string | null = null;

const TOPICS: Record<ControlKey, string> = {
  speed: "/trackpointai/globe/config/motorspeed",
  direction: "/trackpointai/globe/config/motordir",
  volume: "/trackpointai/globe/config/volume",
  haptic: "/trackpointai/globe/config/haptic",
};

function getMqttClient() {
  if (mqttClient && mqttClient.connected) {
    return Promise.resolve(mqttClient);
  }

  if (connectPromise) {
    return connectPromise;
  }

  const client = mqtt.connect(BROKER_URL);
  mqttClient = client;

  connectPromise = new Promise<mqtt.MqttClient>((resolve, reject) => {
    const cleanup = () => {
      client.off("connect", handleConnect);
      client.off("error", handleError);
    };

    const handleConnect = () => {
      cleanup();
      connectPromise = null;
      resolve(client);
    };

    const handleError = (error: Error) => {
      cleanup();
      connectPromise = null;
      mqttClient = null;
      client.end(true);
      reject(error);
    };

    client.once("connect", handleConnect);
    client.once("error", handleError);
  });

  client.on("close", () => {
    mqttClient = null;
  });

  return connectPromise;
}

function publishMessage(client: mqtt.MqttClient, topic: string, message: string) {
  return new Promise<void>((resolve, reject) => {
    client.publish(topic, message, { qos: 1 }, (error) => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

export async function POST(req: Request) {
  const data = (await req.json()) as PublishPayload;
  console.log("[api/publish] incoming payload:", data);
  const sourceChanged = typeof data.source === "string" && data.source !== lastPublishedSource;

  const changedEntries = (Object.keys(TOPICS) as ControlKey[]).filter((key) => {
    if (data[key] === undefined) {
      return false;
    }

    return data[key] !== lastPublishedState[key];
  });

  if (changedEntries.length === 0 && !sourceChanged) {
    console.log("[api/publish] no changed fields, skipping publish");
    return Response.json({ success: true, skipped: true });
  }

  if (sourceChanged) {
    lastPublishedSource = data.source ?? null;
    console.log(`[api/publish] source changed -> ${lastPublishedSource}`);
  }

  try {
    if (changedEntries.length === 0) {
      return Response.json({ success: true, sourceChanged: true, published: [] });
    }

    const client = await getMqttClient();

    for (const key of changedEntries) {
      const value = String(data[key]);
      const topic = TOPICS[key];
      console.log(`[api/publish] publishing ${key} -> ${topic} value=${value}`);
      await publishMessage(client, topic, value);
      lastPublishedState[key] = data[key];
    }

    console.log("[api/publish] published keys:", changedEntries);
    return Response.json({ success: true, sourceChanged, published: changedEntries });
  } catch (error) {
    console.error("[api/publish] publish failed:", error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown MQTT publish error" },
      { status: 500 }
    );
  }
}

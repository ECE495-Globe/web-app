import mqtt from "mqtt";

const BROKER_URL = "mqtt://broker.hivemq.com:1883";

type PublishPayload = {
  speed?: number;
  direction?: number;
  volume?: number;
  haptic?: number;
};

type PublishKey = keyof PublishPayload;

let mqttClient: mqtt.MqttClient | null = null;
let connectPromise: Promise<mqtt.MqttClient> | null = null;
let lastPublishedState: PublishPayload = {};

const TOPICS: Record<PublishKey, string> = {
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
    client.publish(topic, message, { qos: 0 }, (error) => {
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
  const changedEntries = (Object.keys(TOPICS) as PublishKey[]).filter((key) => {
    if (data[key] === undefined) {
      return false;
    }

    return data[key] !== lastPublishedState[key];
  });

  if (changedEntries.length === 0) {
    return Response.json({ success: true, skipped: true });
  }

  try {
    const client = await getMqttClient();

    for (const key of changedEntries) {
      await publishMessage(client, TOPICS[key], String(data[key]));
      lastPublishedState[key] = data[key];
    }

    return Response.json({ success: true, published: changedEntries });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown MQTT publish error" },
      { status: 500 }
    );
  }
}

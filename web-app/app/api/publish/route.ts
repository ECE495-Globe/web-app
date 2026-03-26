import mqtt from "mqtt";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const BROKER_URL = "mqtt://broker.hivemq.com:1883";

type PublishPayload = {
  source?: string;
  clearInstruction?: boolean;
  luminosity?: number;
  luminosityEnabled?: boolean;
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
const INSTRUCTION_TOPIC = "/trackpointai/globe/instruction";
const DATA_DIR = path.join(process.cwd(), "data");
const CONTROL_STATE_FILE = path.join(DATA_DIR, "control-state.json");
const ALL_LOCATION_KEYS = [
  "AFG", "ALB", "ALG", "AGO", "ATG", "ARG", "ARM", "AUS", "AUT", "AZE", "BHS", "BHR", "BGD", "BRB", "BLR",
  "BEL", "BLZ", "BEN", "BTN", "BOL", "BIH", "BWA", "BRA", "BRN", "BGR", "BFA", "BDI", "KHM", "CMR", "CAN",
  "CAF", "TCD", "CHL", "CHN", "COL", "COM", "COG", "COD", "CRI", "CIV", "HRV", "CUB", "CYP", "CZE", "DNK",
  "DJI", "DMA", "DOM", "ECU", "EGY", "SLV", "GNQ", "ERI", "EST", "SWZ", "ETH", "FJI", "FIN", "FRA", "GAB",
  "GMB", "GEO", "DEU", "GHA", "GRC", "GRD", "GTM", "GIN", "GNB", "GUY", "HTI", "HND", "HUN", "ISL", "IND",
  "IDN", "IRN", "IRQ", "IRL", "ISR", "ITA", "JAM", "JPN", "JOR", "KAZ", "KEN", "KIR", "PRK", "KOR", "KWT",
  "KGZ", "KOS", "LAO", "LVA", "LBN", "LSO", "LBR", "LBY", "LTU", "MAD", "MWI", "MYS", "MDV", "MLI", "MLT",
  "MHL", "MRT", "MUS", "MEX", "FSM", "MOL", "MNG", "MNT", "MAR", "MOZ", "MMR", "NAM", "NRU", "NPL", "NLD",
  "NZL", "NIC", "NER", "NGA", "MKD", "NWY", "OMN", "PAK", "PLW", "PAN", "PNG", "PRY", "PER", "PHL", "POL",
  "POR", "PSE", "QAT", "ROU", "RUS", "RWA", "KNA", "LCA", "VCT", "WSM", "STP", "SAU", "SEN", "SRB", "SYC",
  "SLE", "SGP", "SVK", "SVN", "SLB", "SOM", "ZAF", "SSD", "ESP", "LKA", "SDN", "SUR", "SWE", "CHE", "SYR",
  "TWN", "TJK", "TZA", "THA", "TLS", "TGO", "TON", "TTO", "TUN", "TUR", "TKM", "TUV", "UGA", "UKR", "ARE",
  "GBR", "URY", "UZB", "VUT", "VEN", "VNM", "YEM", "ZMB", "ZWE", "Ala", "Alk", "Ari", "Ark", "Cal", "Col",
  "Con", "Del", "Flo", "Geo", "Haw", "Ida", "Ill", "Ind", "Iow", "Kan", "Ken", "Lou", "Mai", "Mar", "Mas",
  "Mic", "Min", "Mis", "Mou", "Mon", "Neb", "Nev", "Neh", "Nem", "Nyc", "Nca", "Nda", "Ohi", "Okl", "Ore",
  "Pen", "Rho", "Sca", "Sda", "Ten", "Tex", "Uta", "Ver", "Vir", "Was", "Wvi", "Wis", "Wyo", "BC", "YT",
  "AB", "NT", "SK", "MB", "NU", "ON", "QC", "NB", "NL", "NS", "PE",
] as const;

function buildClearInstruction() {
  return ALL_LOCATION_KEYS.map((key) => `${key},0,0,0,0`).join("\n");
}

async function persistControlState(data: PublishPayload) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(
    CONTROL_STATE_FILE,
    JSON.stringify(
      {
        luminosity: typeof data.luminosity === "number" ? data.luminosity : 100,
        luminosityEnabled: data.luminosityEnabled !== false,
        updatedAt: new Date().toISOString(),
      },
      null,
      2
    ),
    "utf8"
  );
}

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
  const shouldClearInstruction = data.clearInstruction === true;

  const changedEntries = (Object.keys(TOPICS) as ControlKey[]).filter((key) => {
    if (data[key] === undefined) {
      return false;
    }

    return data[key] !== lastPublishedState[key];
  });

  if (changedEntries.length === 0 && !sourceChanged && !shouldClearInstruction) {
    console.log("[api/publish] no changed fields, skipping publish");
    return Response.json({ success: true, skipped: true });
  }

  if (sourceChanged) {
    lastPublishedSource = data.source ?? null;
    console.log(`[api/publish] source changed -> ${lastPublishedSource}`);
  }

  try {
    await persistControlState(data);
    const client = await getMqttClient();

    if (shouldClearInstruction) {
      console.log("[api/publish] publishing blackout packet");
      await publishMessage(client, INSTRUCTION_TOPIC, buildClearInstruction());
    }

    if (changedEntries.length === 0) {
      return Response.json({
        success: true,
        sourceChanged,
        published: shouldClearInstruction ? ["instruction"] : [],
      });
    }

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

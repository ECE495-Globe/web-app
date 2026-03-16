import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

export async function POST() {
  try {
    // Fetch weather data
    const response = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=38.58&longitude=-121.49&current=temperature_2m,wind_speed_10m"
    );

    const weatherData = await response.json();

    // Package JSON
    const payload = JSON.stringify({
      source: "weather",
      timestamp: new Date().toISOString(),
      data: weatherData.current,
    });

    // Call MQTT Python script and pass JSON
    const scriptPath = path.join(process.cwd(), "scripts/Publish.py");

    exec(`python3 ${scriptPath} '${payload}'`, (error, stdout, stderr) => {
      if (error) {
        console.error(stderr);
      }
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Weather fetch failed" },
      { status: 500 }
    );
  }
}
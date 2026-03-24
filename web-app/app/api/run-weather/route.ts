import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

export async function POST() {
  try {
    // Fetch weather data
    const response = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=38.58&longitude=-121.49&current=temperature_2m"
    );

    const data = await response.json();

    const tempCurr = data.current?.temperature_2m ?? 0;

    // simple temp to RGB mapping
    const rgb =
      tempCurr < -50 ? [255, 255, 255] : // White
      tempCurr < -30 ? [128, 0, 128] : // Purple
      tempCurr < -10 ? [0, 0, 255] : // Blue
      tempCurr < 10 ? [0, 255, 0] : // Green
      tempCurr < 25 ? [255, 255, 0] : // Yellow
      tempCurr < 35 ? [255, 165, 0] : // Orange
      [255, 0, 0]; // Red

    // Package JSON
    const payload = JSON.stringify({
      source: "weather",
      timestamp: new Date().toISOString(),
      data: {
        temp: tempCurr,
        rgb: rgb
      },
    });

    // Call MQTT Python script and pass JSON
    const scriptPath = path.join(process.cwd(), "scripts/weatherEventApp.py");

    exec(`python3 ${scriptPath} '${payload}'`, (error, stdout, stderr) => {
      if (error) {
        console.error("Python error:", stderr);
      } else {
        console.log("Python output:", stdout);
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
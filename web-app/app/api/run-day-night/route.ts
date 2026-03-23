import { NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";

export async function POST() {
  try {
    // Fetch day/night data instead of temperature
    const response = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=38.58&longitude=-121.49&current=is_day"
    );

    const data = await response.json();

    const isDay = data.current?.is_day ?? 0;

    // Optional: map to RGB (same logic as Python)
    const rgb = isDay === 1
      ? [255, 255, 0]  // Day
      : [0, 0, 150];    // Night

    // Package JSON
    const payload = JSON.stringify({
      source: "dayNight",
      timestamp: new Date().toISOString(),
      data: {
        is_day: isDay,
        rgb: rgb
      },
    });

    // Call MQTT Python script and pass JSON
    const scriptPath = path.join(process.cwd(), "scripts/dayNightEventApp.py");

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
      { success: false, error: "Day/Night fetch failed" },
      { status: 500 }
    );
  }
}
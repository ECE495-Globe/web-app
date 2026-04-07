import { NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

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

    console.log("[api/run-weather] sampled weather:", { tempCurr, rgb });
    const scriptPath = path.join(process.cwd(), "scripts/weatherEventApp.py");
    console.log("[api/run-weather] executing:", scriptPath);

    const { stdout, stderr } = await execFileAsync("python3", [scriptPath], { maxBuffer: 1024 * 1024 * 10 });
    if (stdout) {
      console.log("[api/run-weather][python stdout]\n" + stdout);
    }
    if (stderr) {
      console.error("[api/run-weather][python stderr]\n" + stderr);
    }

    return NextResponse.json({ success: true, pythonLogged: true });

  } catch (err) {
    console.error("[api/run-weather] failed:", err);
    return NextResponse.json(
      { success: false, error: "Weather fetch failed" },
      { status: 500 }
    );
  }
}

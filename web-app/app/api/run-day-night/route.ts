import { NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

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
      ? [0, 0, 150]    // Day
      : [255, 255, 0]; // Night

    console.log("[api/run-day-night] sampled day/night:", { isDay, rgb });
    const scriptPath = path.join(process.cwd(), "scripts/dayNightEventApp.py");
    console.log("[api/run-day-night] executing:", scriptPath);

    const { stdout, stderr } = await execFileAsync("python3", [scriptPath], { maxBuffer: 1024 * 1024 * 10 });
    if (stdout) {
      console.log("[api/run-day-night][python stdout]\n" + stdout);
    }
    if (stderr) {
      console.error("[api/run-day-night][python stderr]\n" + stderr);
    }

    return NextResponse.json({ success: true, pythonLogged: true });

  } catch (err) {
    console.error("[api/run-day-night] failed:", err);
    return NextResponse.json(
      { success: false, error: "Day/Night fetch failed" },
      { status: 500 }
    );
  }
}

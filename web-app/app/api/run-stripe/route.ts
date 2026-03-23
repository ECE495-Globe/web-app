import { NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";

export async function POST() {
  try {
    const scriptPath = path.join(process.cwd(), "scripts/stripeEventApp.py");

    execFile("python3", [scriptPath], (error, stdout, stderr) => {
      if (error) {
        console.error("Python error:", stderr);
      } else {
        console.log("Python output:", stdout);
      }
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("Route error:", err);

    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
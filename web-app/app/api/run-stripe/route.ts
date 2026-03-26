import { NextResponse } from "next/server";
import { execFile } from "child_process";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export async function POST() {
  try {
    const scriptPath = path.join(process.cwd(), "scripts/stripeEventApp.py");
    console.log("[api/run-stripe] executing:", scriptPath);

    const { stdout, stderr } = await execFileAsync("python3", [scriptPath], { maxBuffer: 1024 * 1024 * 10 });
    if (stdout) {
      console.log("[api/run-stripe][python stdout]\n" + stdout);
    }
    if (stderr) {
      console.error("[api/run-stripe][python stderr]\n" + stderr);
    }

    return NextResponse.json({ success: true, pythonLogged: true });

  } catch (err) {
    console.error("[api/run-stripe] failed:", err);

    return NextResponse.json(
      { success: false, error: "Stripe script failed" },
      { status: 500 }
    );
  }
}

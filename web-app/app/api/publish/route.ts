import { exec } from "child_process";

export async function POST(req: Request) {

  const data = await req.json();

  const payload = JSON.stringify(data);

  return new Promise((resolve) => {

    exec(`python3 scripts/Publish.py '${payload}'`, (err, stdout, stderr) => {

      if (err) {
        resolve(Response.json({ error: stderr }));
      } else {
        resolve(Response.json({ success: true }));
      }

    });

  });

}
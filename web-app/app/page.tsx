"use client";
import Image from "next/image";
import { useState } from 'react';
import PressButton from "./components/PressButton";

function clamp(value:number, min:number, max:number) {
  return Math.min(Math.max(value, min), max);
}


export default function Home() {
  // Set-up default states for the globe
  const [luminosity, setLuminosity] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [volume, setVolume] = useState(0);
  const [hapticEnabled, setHapticEnabled] = useState(false);
  const [dataSource, setDataSource] = useState("Weather");

  // Subscribe to Mqtt and pull variables temp and Uptime
  const [uptime, setUptime] = useState("0s");
  const [temperature, setTemperature] = useState("-- °C");

  const publishSettings = async () => {

    let direction = 0;
    let speed = Math.abs(rotation);

    if (rotation > 0) direction = 1;
    if (rotation < 0) direction = 2;

    await fetch("/api/publish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "control",
        source: dataSource,
        luminosity,
        speed,
        direction,
        volume,
        haptic: hapticEnabled ? 1 : 0
      }),
    });
  };

  // Day-Night API trigger
  const triggerDayNightScript = async () => {
    try {
      const res = await fetch("/api/run-day-night", {
        method: "POST",
      });

      const data = await res.json();
      console.log("Server response:", data);
    } catch (err) {
      console.error("Error triggering Day-Night script:", err);
    }
  };

  // Weather API trigger
  const triggerWeatherScript = async () => {
    try {
      const res = await fetch("/api/run-weather", {
        method: "POST",
      });

      const data = await res.json();
      console.log("Server response:", data);
    } catch (err) {
      console.error("Error triggering weather script:", err);
    }
  };

  // Stripe API trigger
  const triggerStripeScript = async () => {
    try {
      const res = await fetch("/api/run-stripe", {
        method: "POST",
      });

      const data = await res.json();
      console.log("Server response:", data);
    } catch (err) {
      console.error("Error triggering stripe script:", err);
    }
  };

  return (
    <div className="flex items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col gap-6 py-20 px-16 bg-white dark:bg-black">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1 className="max-w-xs text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50">
            Config
          </h1>
        
        {/* Data Source Buttons */}
        <div className="flex flex-col gap-2">
          <label>Current API: {dataSource}</label>
          <div className="flex gap-4">
            <PressButton
              onClick={async() => {
                setDataSource("Day-Night");
                await triggerDayNightScript();
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Day-Night
            </PressButton>

            <PressButton
              onClick={async () => {
                setDataSource("Weather");
                await triggerWeatherScript();
              }}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
              Weather
            </PressButton>

            <PressButton
              onClick={async () => {
                setDataSource("Stripe");
                await triggerStripeScript();
              }}
              className="px-4 py-2 bg-purple-500 text-white rounded"
            >
              Stripe
            </PressButton>
          </div>
        </div>

        <PressButton
          onClick={publishSettings}
          className="px-6 py-3 bg-red-500 text-white rounded text-lg"
        >
          Publish Settings To Globe
        </PressButton>

        {/* Luminosity Input */}
        <div className="flex flex-col gap-2">
         <label>Luminosity (Global %): {luminosity.toFixed(3)}</label>

          <input
            type="range"
            min="0"
            max="100"
            step="0.001"
            value={luminosity}
            onChange={(e) => setLuminosity(Number(e.target.value))}
          />

          <input
            type="number"
            min="0"
            max="100"
            step="0.001"
            value={luminosity}
            onChange={(e) => setLuminosity(clamp(Number(e.target.value), 0, 100))}
            className="border p-1 rounded w-32"
          />
        </div>

        {/* Rotation Input */}
        <div className="flex flex-col gap-2">
          <label>Rotation (%): {rotation.toFixed(3)}</label>

          <input
            type="range"
            min="0"
            max="100"
            step="0.001"
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
          />

          <input
            type="number"
            min="0"
            max="100"
            step="0.001"
            value={rotation}
            onChange={(e) => setRotation(clamp(Number(e.target.value), 0, 100))}
            className="border p-1 rounded w-32"
          />
        </div>
        <PressButton
          onClick={() => setRotation(Number(0))}
          className="px-4 py-2 bg-yellow-500 text-white rounded"
        >
          Stop Rotation
        </PressButton>
        </div>

        {/* Volume Input */}
        <div className="flex flex-col gap-2">
         <label>Volume (%): {volume}</label>

          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
          />

          <input
            type="number"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => setVolume(clamp(Number(e.target.value), 0, 100))}
            className="border p-1 rounded w-32"
          />
        </div>

        {/* Haptic Feedback Toggle */}
        <div className="flex flex-col gap-2">
          <label>Haptic Feedback</label>

          <PressButton
            onClick={() => setHapticEnabled(!hapticEnabled)}
            className={`px-4 py-2 rounded text-white ${
              hapticEnabled ? "bg-green-500" : "bg-gray-500"
            }`}
          >
            {hapticEnabled ? "Enabled" : "Disabled"}
          </PressButton>
        </div>

        {/* Device Status */}
        <div className="flex flex-col gap-2 border p-4 rounded bg-zinc-100 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Device Status</h2>

          <div className="flex justify-between">
            <span>Temperature:</span>
            <span>{temperature}</span>
          </div>

          <div className="flex justify-between">
            <span>Uptime:</span>
            <span>{uptime}</span>
          

          </div>
          <p className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Luminosity: {" "}
            <a
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Templates
            </a>{" "}
            Rotation: {" "}
            <a
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              className="font-medium text-zinc-950 dark:text-zinc-50"
            >
              Learning
            </a>{" "}
            center.
          </p>
        </div>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row">
          <a
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc] md:w-[158px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 w-full items-center justify-center rounded-full border border-solid border-black/[.08] px-5 transition-colors hover:border-transparent hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a] md:w-[158px]"
            //href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            href=""
            target="_blank"
            rel="noopener noreferrer"
          >
            Send Link
          </a>
        </div>
      </main>
    </div>
  );
}

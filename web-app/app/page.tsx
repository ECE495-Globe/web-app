"use client";
import { useState } from 'react';
import PressButton from "./components/PressButton";

function clamp(value:number, min:number, max:number) {
  return Math.min(Math.max(value, min), max);
}


export default function Home() {
  // Set-up default states for the globe
  const [luminosity, setLuminosity] = useState(100);
  const [luminosityEnabled, setLuminosityEnabled] = useState(true);
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

  const handleLuminosityChange = (value: number) => {
    const nextValue = clamp(value, 0, 100);
    setLuminosity(nextValue);
  };

  const toggleLuminosity = () => {
    setLuminosityEnabled((current) => !current);
  };

  const luminosityMix = luminosity / 100;
  const luminosityColor = `rgb(${Math.round(17 + (255 - 17) * luminosityMix)}, ${Math.round(17 + (207 - 17) * luminosityMix)}, ${Math.round(17 + (90 - 17) * luminosityMix)})`;
  const luminosityFill = `linear-gradient(90deg, ${luminosityColor} 0%, ${luminosityColor} ${luminosity}%, rgba(0, 0, 0, 0.12) ${luminosity}%, rgba(0, 0, 0, 0.12) 100%)`;
  const luminosityGlow = `rgba(255, 207, 90, ${0.18 + luminosityMix * 0.4})`;

  return (
    <div className="flex items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-col gap-6 py-20 px-16 bg-white dark:bg-black">
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
        
        {/* Data Source Buttons */}
        <div className="flex w-full flex-col gap-2">
            <div className="source-band">
              <div className="source-band-title">API Source</div>
              <div className="source-band-options">
                    <PressButton
                        onClick={async () => {
                        setDataSource("Day-Night");
                        await triggerDayNightScript();
                        }}
                        className={`source-pill ${
                        dataSource === "Day-Night" ? "source-pill-active bg-blue-500" : "source-pill-inactive"
                        }`}
                    > Day-Night </PressButton>

                    <PressButton
                        onClick={async () => {
                        setDataSource("Weather");
                        await triggerWeatherScript();
                        }}
                        className={`source-pill ${
                        dataSource === "Weather" ? "source-pill-active bg-green-500" : "source-pill-inactive"
                        }`}
                    > Weather </PressButton>

                    <PressButton
                        onClick={async () => {
                        setDataSource("Stripe");
                        await triggerStripeScript();
                        }}
                        className={`source-pill ${
                        dataSource === "Stripe" ? "source-pill-active bg-purple-500" : "source-pill-inactive"
                        }`}
                    > Stripe </PressButton>
              </div>
            </div>
        </div>

        {/*
        <PressButton
          onClick={publishSettings}
          className="px-6 py-3 bg-red-500 text-white rounded text-lg"
        >
          Publish Settings To Globe
        </PressButton>
            */}
            
        {/* Luminosity Input */}
        <div className={`luminosity-pill ${luminosityEnabled ? "" : "luminosity-pill-off"}`}>
          <div className="luminosity-slider-wrap">
            <div className="luminosity-label-row">
              <span className="luminosity-label">Brightness</span>
              <button
                type="button"
                onClick={toggleLuminosity}
                className={`luminosity-toggle ${luminosityEnabled ? "" : "luminosity-toggle-off"}`}
                aria-label={luminosityEnabled ? "Turn luminosity off" : "Turn luminosity on"}
                title={luminosityEnabled ? "Mute brightness styling" : "Enable brightness styling"}
                style={{ color: luminosityColor, boxShadow: `0 0 0 1px rgba(0,0,0,0.04), 0 8px 20px ${luminosityGlow}` }}
              >
                <svg viewBox="0 0 24 24" className="luminosity-icon" aria-hidden="true">
                  <path
                    d="M9 18h6m-5 3h4m-5.5-6.5c-.9-.9-1.5-2.2-1.5-3.5a5 5 0 1 1 10 0c0 1.3-.6 2.6-1.5 3.5-.7.7-1.2 1.5-1.5 2.5h-3c-.3-1-.8-1.8-1.5-2.5Z"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <input
              type="range"
              min="0"
              max="100"
              step="0.001"
              value={luminosity}
              onChange={(e) => handleLuminosityChange(Number(e.target.value))}
              className="luminosity-slider"
              style={{ background: luminosityFill, color: luminosityColor }}
              aria-label="Luminosity"
            />
          </div>
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
    
      </main>
    </div>
  );
}

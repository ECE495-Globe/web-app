"use client";
import type { CSSProperties } from "react";
import { useState } from 'react';
import PressButton from "./components/PressButton";

const LUMINOSITY_ICON_PATH =
  "M9 18h6m-5 3h4m-5.5-6.5c-.9-.9-1.5-2.2-1.5-3.5a5 5 0 1 1 10 0c0 1.3-.6 2.6-1.5 3.5-.7.7-1.2 1.5-1.5 2.5h-3c-.3-1-.8-1.8-1.5-2.5Z";

const VOLUME_ON_ICON_PATH =
  "M4 10v4h3l4 4V6l-4 4H4Zm11.5-2.5a5 5 0 0 1 0 9m-2.5-6.5a2.5 2.5 0 0 1 0 4";

const VOLUME_OFF_ICON_PATH =
  "M4 10v4h3l4 4V6l-4 4H4Zm9 1 6 6m0-6-6 6";

const ROTATION_ICON_PATH =
  "M20 12a8 8 0 1 1-2.34-5.66M20 4v5h-5";

function clamp(value:number, min:number, max:number) {
  return Math.min(Math.max(value, min), max);
}

function interpolateChannel(start: number, end: number, mix: number) {
  return Math.round(start + (end - start) * mix);
}

function buildControlStyles({
  value,
  enabled,
  colorStart,
  colorEnd,
  glowColor,
  glowStrength,
}: {
  value: number;
  enabled: boolean;
  colorStart: [number, number, number];
  colorEnd: [number, number, number];
  glowColor: [number, number, number];
  glowStrength: number;
}) {
  const mix = value / 100;

  const color = `rgb(${interpolateChannel(colorStart[0], colorEnd[0], mix)}, ${interpolateChannel(colorStart[1], colorEnd[1], mix)}, ${interpolateChannel(colorStart[2], colorEnd[2], mix)})`;

  const fill = `linear-gradient(90deg, ${color} 0%, ${color} ${value}%, rgba(0, 0, 0, 0.12) ${value}%, rgba(0, 0, 0, 0.12) 100%)`;

  const glow = `rgba(${glowColor[0]}, ${glowColor[1]}, ${glowColor[2]}, ${0.18 + mix * glowStrength})`;

  const toggleStyle = {
    color: enabled ? color : "#3f3f46",
    boxShadow: enabled
      ? `0 0 0 1px rgba(0,0,0,0.04), 0 8px 20px ${glow}`
      : "0 0 0 1px rgba(63,63,70,0.18)",
  };

  return { color, fill, glow, toggleStyle };
}

export default function Home() {
  // Set-up default states for the globe
  const [luminosity, setLuminosity] = useState(100);
  const [luminosityEnabled, setLuminosityEnabled] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [rotationEnabled, setRotationEnabled] = useState(true);
  const [volume, setVolume] = useState(0);
  const [volumeEnabled, setVolumeEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(false);
  const [dataSource, setDataSource] = useState("Weather");

  // Subscribe to Mqtt and pull variables temp and Uptime
  const [uptime, setUptime] = useState("0s");
  const [temperature, setTemperature] = useState("-- °C");

  const publishSettings = async () => {

    let direction = 0;
    let speed = rotationEnabled ? Math.abs(rotation) : 0;

    if (rotationEnabled && rotation > 0) direction = 1;
    if (rotationEnabled && rotation < 0) direction = 2;

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

  const handleVolumeChange = (value: number) => {
    setVolume(clamp(value, 0, 100));
  };

  const toggleVolume = () => {
    setVolumeEnabled((current) => !current);
  };

  const handleRotationChange = (value: number) => {
    setRotation(clamp(value, 0, 100));
  };

  const toggleRotation = () => {
    setRotationEnabled((current) => !current);
  };

  const {
    color: luminosityColor,
    fill: luminosityFill,
    toggleStyle: luminosityToggleStyle,
  } = buildControlStyles({
    value: luminosity,
    enabled: luminosityEnabled,
    colorStart: [120, 86, 28],
    colorEnd: [255, 207, 90],
    glowColor: [255, 207, 90],
    glowStrength: 0.4,
  });

  const {
    color: volumeColor,
    fill: volumeFill,
    toggleStyle: volumeToggleStyle,
  } = buildControlStyles({
    value: volume,
    enabled: volumeEnabled,
    colorStart: [130, 190, 220],
    colorEnd: [168, 228, 255],
    glowColor: [140, 205, 255],
    glowStrength: 0.35,
  });

  const {
    color: rotationColor,
    fill: rotationFill,
    toggleStyle: rotationToggleStyle,
  } = buildControlStyles({
    value: rotation,
    enabled: rotationEnabled,
    colorStart: [132, 58, 28],
    colorEnd: [255, 122, 69],
    glowColor: [255, 122, 69],
    glowStrength: 0.32,
  });

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
            
        <div className="level-controls">
          {/* Luminosity Input */}
          <div className={`luminosity-pill ${luminosityEnabled ? "" : "luminosity-pill-off"}`}>
            <div className="luminosity-slider-wrap">
              <div className="luminosity-label-row">
                <label className="luminosity-label">
                  <span>Brightness:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(luminosity)}
                    onChange={(e) => handleLuminosityChange(Number(e.target.value))}
                    className="pill-value-input"
                    disabled={!luminosityEnabled}
                    aria-label="Brightness value"
                  />
                  <span>%</span>
                </label>
                <button
                  type="button"
                  onClick={toggleLuminosity}
                  className={`luminosity-toggle ${luminosityEnabled ? "" : "luminosity-toggle-off"}`}
                  aria-label={luminosityEnabled ? "Turn luminosity off" : "Turn luminosity on"}
                  title={luminosityEnabled ? "Mute brightness styling" : "Enable brightness styling"}
                  style={luminosityToggleStyle}
                >
                  <svg viewBox="0 0 24 24" className="luminosity-icon" aria-hidden="true">
                    <path
                      d={LUMINOSITY_ICON_PATH}
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

          {/* Volume Input */}
          <div className={`volume-pill ${volumeEnabled ? "" : "volume-pill-off"}`}>
            <div className="volume-slider-wrap">
              <div className="volume-label-row">
                <label className="volume-label">
                  <span>Volume:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(volume)}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    className="pill-value-input"
                    disabled={!volumeEnabled}
                    aria-label="Volume value"
                  />
                  <span>%</span>
                </label>
                <button
                  type="button"
                  onClick={toggleVolume}
                  className={`volume-toggle ${volumeEnabled ? "" : "volume-toggle-off"}`}
                  aria-label={volumeEnabled ? "Turn volume off" : "Turn volume on"}
                  title={volumeEnabled ? "Mute volume styling" : "Enable volume styling"}
                  style={volumeToggleStyle}
                >
                  <svg viewBox="0 0 24 24" className="volume-icon" aria-hidden="true">
                    <path
                      d={volumeEnabled ? VOLUME_ON_ICON_PATH : VOLUME_OFF_ICON_PATH}
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
                value={volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="volume-slider"
                style={{ background: volumeFill, color: volumeColor }}
                aria-label="Volume"
              />
            </div>
          </div>
        </div>

        <div className="motion-controls">
          <div className={`rotation-pill ${rotationEnabled ? "" : "rotation-pill-off"}`}>
            <div className="rotation-slider-wrap">
              <div className="rotation-label-row">
                <label className="rotation-label">
                  <span>Rotation Speed:</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(rotation)}
                    onChange={(e) => handleRotationChange(Number(e.target.value))}
                    className="pill-value-input"
                    disabled={!rotationEnabled}
                    aria-label="Rotation speed value"
                  />
                  <span>%</span>
                </label>
                <button
                  type="button"
                  onClick={toggleRotation}
                  className={`rotation-toggle ${rotationEnabled ? "" : "rotation-toggle-off"}`}
                  aria-label={rotationEnabled ? "Turn rotation off" : "Turn rotation on"}
                  title={rotationEnabled ? "Mute rotation styling" : "Enable rotation styling"}
                  style={rotationToggleStyle}
                >
                  <svg viewBox="0 0 24 24" className="rotation-icon" aria-hidden="true">
                    <path
                      d={ROTATION_ICON_PATH}
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
                value={rotation}
                onChange={(e) => handleRotationChange(Number(e.target.value))}
                className="rotation-slider"
                style={{
                  "--rotation-fill": rotationFill,
                  "--rotation-color": rotationColor,
                } as CSSProperties}
                aria-label="Rotation Speed"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setHapticEnabled(!hapticEnabled)}
            className={`haptic-pill ${hapticEnabled ? "haptic-pill-on" : "haptic-pill-off"}`}
            aria-pressed={hapticEnabled}
          >
            <span className="haptic-label">Haptic Feedback</span>
            <span className="haptic-state">{hapticEnabled ? "On" : "Off"}</span>
          </button>
        </div>

        {/* Device Status */}
        <div className="flex w-full flex-col gap-2 border p-4 rounded bg-zinc-100 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold">Device Status</h2>

          <div className="flex justify-between">
            <span>Temperature:</span>
            <span>{temperature}</span>
          </div>

          <div className="flex justify-between">
            <span>Uptime:</span>
            <span>{uptime}</span>
          

          </div>
        </div>
        </div>
    
      </main>
    </div>
  );
}

import React, { useMemo } from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import audioData from "../../public/audio-data.json";

export const MusicVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Audio properties
  const currentTime = frame / fps;

  // Find current and previous beat index
  const currentBeatIndex = useMemo(() => {
    let index = 0;
    for (let i = 0; i < audioData.beats.length; i++) {
      if (currentTime >= audioData.beats[i]) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [currentTime]);

  const beatProgress = useMemo(() => {
    if (currentBeatIndex === 0) return 0;
    const beatTime = audioData.beats[currentBeatIndex];
    const nextBeatTime = currentBeatIndex < audioData.beats.length - 1 ? audioData.beats[currentBeatIndex + 1] : beatTime + (60 / audioData.tempo);
    return interpolate(currentTime, [beatTime, nextBeatTime], [0, 1], { extrapolateRight: "clamp" });
  }, [currentTime, currentBeatIndex]);

  // Find current RMS
  const currentRms = useMemo(() => {
    // Binary search or linear search since it's ordered
    let index = 0;
    for (let i = 0; i < audioData.rms_times.length; i++) {
      if (currentTime >= audioData.rms_times[i]) {
        index = i;
      } else {
        break;
      }
    }
    return audioData.rms[index] || 0;
  }, [currentTime]);

  // Find recent onset
  const timeSinceOnset = useMemo(() => {
    let lastOnset = 0;
    for (let i = 0; i < audioData.onsets.length; i++) {
      if (currentTime >= audioData.onsets[i]) {
        lastOnset = audioData.onsets[i];
      } else {
        break;
      }
    }
    return currentTime - lastOnset;
  }, [currentTime]);

  const onsetFlash = interpolate(timeSinceOnset, [0, 0.1, 0.3], [0, 1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const baseHue = (currentTime * 10) % 360;

  const bgHue = baseHue;
  const bgColor = `hsl(${bgHue}, 50%, ${10 + onsetFlash * 20}%)`;

  const cx = width / 2;
  const cy = height / 2;

  // Pulse central circle based on RMS
  const centralScale = 1 + currentRms * 15;

  return (
    <AbsoluteFill style={{ backgroundColor: bgColor }}>
      <Audio src={staticFile("fast-rap-song.m4a")} />

      <svg width={width} height={height} style={{ position: "absolute" }}>
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Abstract background shapes bouncing to beat */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 2 + (currentTime * 0.5) * (i % 2 === 0 ? 1 : -1);
          const r = 300 + Math.sin(currentTime * 2 + i) * 100 + currentRms * 800;
          const x = cx + Math.cos(angle) * r;
          const y = cy + Math.sin(angle) * r;
          return (
            <circle
              key={`bg-${i}`}
              cx={x}
              cy={y}
              r={20 + currentRms * 100}
              fill={`hsl(${(baseHue + i * 30) % 360}, 80%, 50%)`}
              opacity={0.3 + onsetFlash * 0.3}
              filter="url(#glow)"
            />
          );
        })}

        {/* Rotating Rings */}
        {Array.from({ length: 5 }).map((_, i) => {
          const baseRadius = 150 + i * 80;
          // Rotate depending on beat index parity
          const rotationSpeed = (i + 1) * 0.5 * (currentBeatIndex % 2 === 0 ? 1 : -1);
          const currentRotation = currentTime * rotationSpeed * Math.PI;

          return (
            <g
              key={`ring-${i}`}
              style={{
                transform: `rotate(${currentRotation}rad)`,
                transformOrigin: `${cx}px ${cy}px`
              }}
            >
              <circle
                cx={cx}
                cy={cy}
                r={baseRadius + currentRms * 150 * (i * 0.2)}
                fill="none"
                stroke={`hsl(${(baseHue + 180 + i * 20) % 360}, 70%, 60%)`}
                strokeWidth={2 + currentRms * 10 + (onsetFlash * 5)}
                strokeDasharray={`${20 + i * 10} ${10 + i * 5}`}
                opacity={0.6 + onsetFlash * 0.4}
                filter="url(#glow)"
              />
            </g>
          );
        })}

        {/* Central Pulse Element */}
        <g style={{
          transform: `scale(${centralScale * (1 + onsetFlash * 0.2)})`,
          transformOrigin: `${cx}px ${cy}px`
        }}>
          <circle
            cx={cx}
            cy={cy}
            r={100}
            fill={`hsl(${(baseHue + 90) % 360}, 90%, 60%)`}
            filter="url(#glow)"
            opacity={0.8}
          />
          <circle
            cx={cx}
            cy={cy}
            r={80}
            fill="#000"
          />
          {/* Inner details */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i / 8) * Math.PI * 2 + currentTime;
            return (
              <circle
                key={`inner-${i}`}
                cx={cx + Math.cos(angle) * 40}
                cy={cy + Math.sin(angle) * 40}
                r={15}
                fill={`hsl(${baseHue}, 100%, 70%)`}
              />
            );
          })}
        </g>

        {/* Dynamic Equalizer Bars reacting to RMS */}
        {Array.from({ length: 40 }).map((_, i) => {
            const angle = (i / 40) * Math.PI * 2;
            const r1 = 450;
            const r2 = r1 + 50 + currentRms * 1000 * Math.abs(Math.sin(currentTime * 5 + i * 0.5));
            return (
                <line
                    key={`eq-${i}`}
                    x1={cx + Math.cos(angle) * r1}
                    y1={cy + Math.sin(angle) * r1}
                    x2={cx + Math.cos(angle) * r2}
                    y2={cy + Math.sin(angle) * r2}
                    stroke={`hsl(${(baseHue + i * 9) % 360}, 80%, 60%)`}
                    strokeWidth={4}
                    strokeLinecap="round"
                    filter="url(#glow)"
                    opacity={0.7}
                />
            )
        })}

      </svg>

      {/* Beat synchronized flash overlay */}
      <AbsoluteFill style={{
          backgroundColor: 'white',
          opacity: interpolate(beatProgress, [0, 0.1, 1], [0.3, 0, 0]),
          pointerEvents: 'none'
      }} />

    </AbsoluteFill>
  );
};

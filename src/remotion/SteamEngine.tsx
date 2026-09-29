import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, spring, Sequence, interpolate } from "remotion";

export const SteamEngine: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Intro animation
  const introScale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 90 },
  });

  const introOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Engine Parameters
  const W_x = 1400;
  const W_y = 540;
  const R = 180;
  const L = 550;

  // Speed - starts slow, speeds up
  // integrating speed over time
  // an approximation since speed is variable
  const theta = frame < 120
    ? (frame / fps) * Math.PI * 2 * (0.1 + (1.1 * (frame / 120)) / 2) // area under triangle/trapezoid
    : (120 / fps) * Math.PI * 2 * (0.1 + 1.1 / 2) + ((frame - 120) / fps) * Math.PI * 2 * 1.2;

  // Kinematics
  const x_c = R * Math.cos(theta);
  const y_c = R * Math.sin(theta);
  const crank_x = W_x + x_c;
  const crank_y = W_y + y_c;
  const piston_x = W_x + x_c - Math.sqrt(L * L - y_c * y_c);

  return (
    <AbsoluteFill style={{ backgroundColor: "#07070e", overflow: "hidden" }}>
      <svg width="1920" height="1080" style={{ position: "absolute" }}>
        <defs>
          <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="15" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-orange" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="20" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-green" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="15" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="glow-purple" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <linearGradient id="boiler-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ff5500" />
            <stop offset="100%" stopColor="#aa0000" />
          </linearGradient>
          <linearGradient id="cylinder-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(0, 255, 255, 0.1)" />
            <stop offset="100%" stopColor="rgba(0, 255, 255, 0.3)" />
          </linearGradient>
        </defs>

        {/* Boiler */}
        <rect
          x="100" y={W_y - 150} width="400" height="300" rx="30"
          fill="url(#boiler-grad)"
          stroke="#ff7700" strokeWidth="4"
          filter="url(#glow-orange)"
        />
        {/* Fire inside boiler */}
        <g opacity={introOpacity}>
          <circle
            cx="200"
            cy={W_y}
            r={80 + Math.sin(frame * 0.5) * 10}
            fill="#ffdd00"
            filter="url(#glow-orange)"
            opacity={0.8}
          />
          {Array.from({ length: 5 }).map((_, i) => {
            const yOff = (frame * (3 + i) + i * 20) % 150;
            const xOff = Math.sin((frame + i * 10) * 0.1) * 20;
            return (
              <circle
                key={i}
                cx={150 + i * 25 + xOff}
                cy={W_y + 80 - yOff}
                r={15 - yOff * 0.1}
                fill="#ffaa00"
                filter="url(#glow-orange)"
                opacity={1 - yOff / 150}
              />
            );
          })}
        </g>

        {/* Steam Pipe */}
        <g opacity={introOpacity}>
          <path
            d={`M 300 ${W_y - 150} L 300 ${W_y - 250} L 750 ${W_y - 250} L 750 ${W_y - 120}`}
            fill="none"
            stroke="#00ffff"
            strokeWidth="20"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#glow-cyan)"
            opacity={0.6}
          />
          {/* Steam particles flowing in pipe */}
          {Array.from({ length: 15 }).map((_, i) => {
            const pFrame = (frame * 3 + i * 30) % 550;
            let px = 300;
            let py = W_y - 150;
            if (pFrame < 100) {
              py -= pFrame;
            } else if (pFrame < 450) {
              py = W_y - 250;
              px += (pFrame - 100) * (450/350);
            } else {
              px = 750;
              py = W_y - 250 + (pFrame - 450) * 1.3;
            }

            return (
              <circle
                key={`steam-${i}`}
                cx={px}
                cy={py}
                r="6"
                fill="#ffffff"
                filter="url(#glow-cyan)"
              />
            );
          })}
        </g>

        {/* Cylinder */}
        <rect
          x="600" y={W_y - 120} width="300" height="240" rx="10"
          fill="url(#cylinder-grad)"
          stroke="#00ffff" strokeWidth="4"
          filter="url(#glow-cyan)"
        />

        {/* Piston Head */}
        <rect
          x={piston_x - 180} y={W_y - 110} width="60" height="220" rx="10"
          fill="#ffffff"
          filter="url(#glow-cyan)"
        />

        {/* Piston Rod */}
        <line
          x1={piston_x - 120} y1={W_y} x2={piston_x} y2={W_y}
          stroke="#ffffff" strokeWidth="20"
          filter="url(#glow-cyan)"
        />

        {/* Connecting Rod */}
        <line
          x1={piston_x} y1={W_y} x2={crank_x} y2={crank_y}
          stroke="#ff00ff" strokeWidth="30" strokeLinecap="round"
          filter="url(#glow-purple)"
        />

        {/* Piston Pin */}
        <circle cx={piston_x} cy={W_y} r="25" fill="#fff" />

        {/* Wheel container with intro scaling */}
        <g style={{ transform: `scale(${introScale})`, transformOrigin: `${W_x}px ${W_y}px` }}>
          {/* Wheel */}
          <circle cx={W_x} cy={W_y} r="250" fill="none" stroke="#00ffaa" strokeWidth="20" filter="url(#glow-green)" />
          <circle cx={W_x} cy={W_y} r="230" fill="none" stroke="#00ffaa" strokeWidth="4" opacity={0.5} />

        {/* Spokes */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = theta + (i * Math.PI) / 4;
          return (
            <line
              key={i}
              x1={W_x} y1={W_y}
              x2={W_x + 250 * Math.cos(angle)}
              y2={W_y + 250 * Math.sin(angle)}
              stroke="#00ffaa" strokeWidth="10"
              filter="url(#glow-green)"
              opacity={0.8}
            />
          );
        })}

          {/* Crank Pin */}
          <circle cx={crank_x} cy={crank_y} r="30" fill="#ffffff" filter="url(#glow-cyan)" />
          {/* Wheel Center */}
          <circle cx={W_x} cy={W_y} r="40" fill="#ffffff" filter="url(#glow-cyan)" />
        </g>
      </svg>

      {/* Cinematic Overlays */}
      <AbsoluteFill
        style={{
          boxShadow: "inset 0 0 150px rgba(0,0,0,0.9)",
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill
        style={{
          background: "radial-gradient(circle, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Title */}
      <Sequence from={30}>
        <div
          style={{
            position: "absolute",
            top: 100,
            left: 100,
            color: "white",
            fontFamily: "sans-serif",
            fontSize: 64,
            fontWeight: "bold",
            textShadow: "0 0 20px #00ffff",
            opacity: interpolate(frame, [30, 45], [0, 1], { extrapolateRight: "clamp" }),
            transform: `translateY(${interpolate(frame, [30, 50], [20, 0], { extrapolateRight: "clamp" })}px)`,
          }}
        >
          THE STEAM ENGINE
        </div>
        <div
          style={{
            position: "absolute",
            top: 180,
            left: 100,
            color: "#00ffaa",
            fontFamily: "sans-serif",
            fontSize: 32,
            opacity: interpolate(frame, [45, 60], [0, 1], { extrapolateRight: "clamp" }),
          }}
        >
          Converting heat into mechanical energy
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};

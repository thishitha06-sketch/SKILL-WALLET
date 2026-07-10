/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";

interface LogoProps {
  className?: string;
  size?: number;
}

export function Logo({ className = "", size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className}`}
    >
      <defs>
        <linearGradient id="logo-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c8ff00" /> {/* Lime Yellow */}
          <stop offset="50%" stopColor="#22c55e" /> {/* Emerald */}
          <stop offset="100%" stopColor="#ff0040" /> {/* Crimson */}
        </linearGradient>
        <radialGradient id="logo-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c8ff00" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#c8ff00" stopOpacity="0" />
        </radialGradient>
        <filter id="logo-blur" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="8" result="blur" />
        </filter>
      </defs>

      {/* Outer Glow */}
      <circle cx="50" cy="50" r="40" fill="url(#logo-glow)" filter="url(#logo-blur)" />

      {/* Network Nodes and Links */}
      <path
        d="M25 50 L50 25 L75 50 L50 75 Z"
        stroke="url(#logo-grad-1)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.4"
      />
      <path
        d="M50 25 L50 75"
        stroke="url(#logo-grad-1)"
        strokeWidth="2"
        strokeDasharray="4 4"
        opacity="0.3"
      />
      <path
        d="M25 50 L75 50"
        stroke="url(#logo-grad-1)"
        strokeWidth="2"
        strokeDasharray="4 4"
        opacity="0.3"
      />

      {/* Dynamic central "N" spark */}
      <path
        d="M36 64 V36 L64 64 V36"
        stroke="url(#logo-grad-1)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Orbiting nodes */}
      <circle cx="25" cy="50" r="5" fill="#c8ff00" />
      <circle cx="50" cy="25" r="5" fill="#22c55e" />
      <circle cx="75" cy="50" r="5" fill="#ff0040" />
      <circle cx="50" cy="75" r="5" fill="#22c55e" />
      
      {/* Central glow core */}
      <circle cx="50" cy="50" r="3.5" fill="#ffffff" />
    </svg>
  );
}

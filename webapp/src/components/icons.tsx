import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 400 450"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      {/* Background Circle Composition */}
      <circle cx="200" cy="200" r="160" fill="#3D3060" />
      <path
        d="M200 40C288.366 40 360 111.634 360 200L200 200V40Z"
        fill="#8E84B1"
      />
      
      {/* Stylized Reaching Figure (White) */}
      <circle cx="200" cy="145" r="38" fill="white" />
      <path
        d="M200 190C160 190 100 120 70 70C110 110 170 180 200 190C230 180 290 110 330 70C300 120 240 190 200 190Z"
        fill="white"
      />
      <path
        d="M200 190C200 190 160 280 140 380C160 340 190 200 200 190Z"
        fill="white"
      />
      <path
        d="M200 190C200 190 240 240 280 280C240 240 210 200 200 190Z"
        fill="white"
      />

      {/* Jeiva Identity below the icon */}
      <g transform="translate(110, 380)">
        <text 
          x="0" 
          y="30" 
          fill="#3D3060" 
          fontSize="42" 
          fontWeight="500" 
          fontFamily="var(--font-manrope), sans-serif"
          letterSpacing="-0.02em"
        >
          Jeiva-
        </text>
        {/* Pulse/ECG Line */}
        <path 
          d="M135 25 L145 25 L155 5 L165 45 L175 25 L185 25" 
          stroke="#3D3060" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none" 
        />
        {/* Heart Icon */}
        <path 
          d="M195 25 C195 20 202 18 205 22 C208 18 215 20 215 25 C215 32 205 38 205 38 C205 38 195 32 195 25Z" 
          fill="#3D3060" 
        />
      </g>
    </svg>
  );
}

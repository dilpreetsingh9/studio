import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 2L12 22" />
      <path d="M2 12L22 12" />
      <path d="M17.5 6.5L17.5 6.5" />
      <path d="M6.5 17.5L6.5 17.5" />
      <path d="M6.5 6.5L6.5 6.5" />
      <path d="M17.5 17.5L17.5 17.5" />
    </svg>
  );
}

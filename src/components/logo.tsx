import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 25"
      fill="none"
      aria-label="SheRide Logo"
      {...props}
    >
      <text
        x="0"
        y="20"
        fontFamily="'Belleza', sans-serif"
        fontSize="24"
        fontWeight="bold"
        fill="currentColor"
      >
        She<tspan fill="hsl(var(--primary))">Ride</tspan>
      </text>
    </svg>
  );
}

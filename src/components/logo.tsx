import type { SVGProps } from 'react';

export function Logo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 30"
      fill="none"
      aria-label="SheRide Logo"
      {...props}
    >
      <text
        x="0"
        y="24"
        fontFamily="Belleza, var(--font-sans), sans-serif"
        fontSize="28"
        fontWeight="bold"
        fill="currentColor"
      >
        She<tspan fill="hsl(var(--primary))">Ride</tspan>
      </text>
    </svg>
  );
}

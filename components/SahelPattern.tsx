/** Motif géométrique discret inspiré des textiles/architectures sahéliennes — SVG pur, aucune image externe. */
export function SahelPattern({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 400 400"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <pattern id="sahel-diamond" width="50" height="50" patternUnits="userSpaceOnUse">
          <path
            d="M25 2 L48 25 L25 48 L2 25 Z"
            stroke="currentColor"
            strokeWidth="1"
            fill="none"
            opacity="0.5"
          />
          <circle cx="25" cy="25" r="2.5" fill="currentColor" opacity="0.4" />
        </pattern>
      </defs>
      <rect width="400" height="400" fill="url(#sahel-diamond)" />
    </svg>
  );
}

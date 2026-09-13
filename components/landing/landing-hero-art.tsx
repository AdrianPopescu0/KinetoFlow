export function LandingHeroArt() {
  return (
    <svg
      viewBox="0 0 1200 800"
      className="absolute inset-0 h-full w-full"
      preserveAspectRatio="xMaxYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="kf-hero-flow" x1="120" y1="720" x2="980" y2="80" gradientUnits="userSpaceOnUse">
          <stop stopColor="#14b8a6" stopOpacity="0.55" />
          <stop offset="0.55" stopColor="#2dd4bf" stopOpacity="0.28" />
          <stop offset="1" stopColor="#99f6e4" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id="kf-hero-ring" x1="700" y1="120" x2="1100" y2="620" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2dd4bf" stopOpacity="0.35" />
          <stop offset="1" stopColor="#042f2e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M180 640C320 520 410 430 520 360C680 258 820 210 1040 170"
        fill="none"
        stroke="url(#kf-hero-flow)"
        strokeWidth="2.4"
        strokeLinecap="round"
        className="kf-hero-flow"
      />
      <path
        d="M140 560C300 470 430 390 560 330C740 248 900 210 1120 190"
        fill="none"
        stroke="url(#kf-hero-flow)"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.55"
        className="kf-hero-flow kf-hero-flow-slow"
      />
      <circle cx="920" cy="280" r="170" fill="none" stroke="url(#kf-hero-ring)" strokeWidth="1.2" />
      <circle cx="920" cy="280" r="250" fill="none" stroke="url(#kf-hero-ring)" strokeWidth="1" opacity="0.45" />
      <circle cx="760" cy="210" r="7" fill="#2dd4bf" opacity="0.7" className="kf-hero-pulse" />
    </svg>
  )
}

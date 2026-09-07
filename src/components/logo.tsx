export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path d="M12 1.5 22 7v10l-10 5.5L2 17V7z" fill="url(#logo-grad)" />
      <path d="M12 1.5 22 7l-10 5.5L2 7z" fill="white" fillOpacity="0.18" />
      <path d="M12 12.5 22 7v10l-10 5.5z" fill="black" fillOpacity="0.12" />
      <defs>
        <linearGradient id="logo-grad" x1="2" y1="1.5" x2="22" y2="22" gradientUnits="userSpaceOnUse">
          <stop stopColor="#5B8DEF" />
          <stop offset="1" stopColor="#3E6FE0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function Basket() {
  return (
    <svg
      viewBox="0 0 800 700"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
      preserveAspectRatio="none"
    >
      <defs>
        <pattern
          id="wicker"
          width="18"
          height="18"
          patternUnits="userSpaceOnUse"
        >
          <rect width="18" height="18" fill="#8a5428" />
          <path
            d="M0 0h18M0 9h18M0 0v18M9 0v18"
            stroke="#c4894a"
            strokeWidth="3"
          />
          <path
            d="M0 4.5h18M0 13.5h18M4.5 0v18M13.5 0v18"
            stroke="#6b3d18"
            strokeWidth="1.2"
          />
        </pattern>
        <pattern
          id="wicker-dark"
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <rect width="16" height="16" fill="#5c3314" />
          <path
            d="M0 0h16M0 8h16M0 0v16M8 0v16"
            stroke="#8a5428"
            strokeWidth="2.5"
          />
        </pattern>
        <radialGradient id="bowl-shadow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#3a1c0a" stopOpacity="0.15" />
          <stop offset="70%" stopColor="#3a1c0a" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#2a1408" stopOpacity="0.7" />
        </radialGradient>
        <filter id="basket-drop" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow
            dx="0"
            dy="18"
            stdDeviation="16"
            floodColor="#4a2030"
            floodOpacity="0.35"
          />
        </filter>
      </defs>

      <ellipse
        cx="400"
        cy="380"
        rx="390"
        ry="300"
        fill="url(#wicker-dark)"
        filter="url(#basket-drop)"
      />
      <ellipse cx="400" cy="370" rx="340" ry="250" fill="url(#bowl-shadow)" />
      <ellipse
        cx="400"
        cy="355"
        rx="318"
        ry="228"
        fill="#5a2e12"
        opacity="0.55"
      />

      <ellipse
        cx="400"
        cy="160"
        rx="360"
        ry="70"
        fill="none"
        stroke="url(#wicker)"
        strokeWidth="28"
      />
      <ellipse
        cx="400"
        cy="158"
        rx="360"
        ry="70"
        fill="none"
        stroke="#d4a574"
        strokeWidth="6"
        opacity="0.5"
      />
      <ellipse
        cx="400"
        cy="168"
        rx="360"
        ry="70"
        fill="none"
        stroke="#4a2610"
        strokeWidth="4"
        opacity="0.4"
      />

      <path
        d="M48 200 C 20 280, 20 480, 120 560"
        fill="none"
        stroke="url(#wicker)"
        strokeWidth="26"
        strokeLinecap="round"
      />
      <path
        d="M752 200 C 780 280, 780 480, 680 560"
        fill="none"
        stroke="url(#wicker)"
        strokeWidth="26"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function Logo({ className = "w-12 h-12" }) {
  return (
    <svg
      viewBox="0 0 120 120"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Gradient definitions */}
      <defs>
        <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#ef4444" />
        </linearGradient>
      </defs>
      
      {/* Background circle with gradient */}
      <circle cx="60" cy="60" r="55" fill="url(#gradient1)" opacity="0.1" />
      
      {/* Main V shape */}
      <path
        d="M 30 25 L 60 75 L 90 25"
        stroke="url(#gradient1)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Lightning bolt inside V */}
      <path
        d="M 55 50 L 50 65 L 65 65 L 60 80"
        stroke="url(#gradient2)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      
      {/* Small accent dots */}
      <circle cx="45" cy="35" r="3" fill="#6366f1" opacity="0.6" />
      <circle cx="75" cy="35" r="3" fill="#8b5cf6" opacity="0.6" />
      <circle cx="52" cy="85" r="2.5" fill="#f59e0b" opacity="0.7" />
    </svg>
  );
}


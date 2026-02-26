export default function SonnyDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
      <defs>
        {/* ===== SKIN GRADIENTS ===== */}

        {/* Base skin tone with offset focal point for natural roundness */}
        <radialGradient id="sonny-skin-base" fx="35%" fy="30%" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FEF0E6" />
          <stop offset="40%" stopColor="#FDE8D8" />
          <stop offset="75%" stopColor="#F5C6A0" />
          <stop offset="100%" stopColor="#E8C4B0" />
        </radialGradient>

        {/* Subsurface scattering glow - warm pink from center-bottom */}
        <radialGradient id="sonny-skin-sss" fx="50%" fy="70%" cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#FFB0A0" stopOpacity="0" />
          <stop offset="50%" stopColor="#FFB0A0" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#FF9080" stopOpacity="0.25" />
        </radialGradient>

        {/* Ambient occlusion - transparent top to dark bottom */}
        <linearGradient id="sonny-skin-ao" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5A3020" stopOpacity="0" />
          <stop offset="100%" stopColor="#5A3020" stopOpacity="0.15" />
        </linearGradient>

        {/* Specular highlight - upper-left shine */}
        <radialGradient id="sonny-skin-shine" fx="32%" fy="25%" cx="40%" cy="35%" r="45%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </radialGradient>

        {/* ===== ELEPHANT GRADIENTS ===== */}

        <radialGradient id="sonny-elephant-base" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#87CEEB" />
          <stop offset="50%" stopColor="#6BA3C7" />
          <stop offset="100%" stopColor="#5A8FAF" />
        </radialGradient>

        <radialGradient id="sonny-elephant-inner-ear" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#B8D8EA" />
          <stop offset="100%" stopColor="#87CEEB" />
        </radialGradient>

        {/* ===== KOALA GRADIENTS ===== */}

        <radialGradient id="sonny-koala-base" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#B5B5B5" />
          <stop offset="50%" stopColor="#A5A5A5" />
          <stop offset="100%" stopColor="#8A8A8A" />
        </radialGradient>

        <radialGradient id="sonny-koala-inner-ear" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F0D8E0" />
          <stop offset="100%" stopColor="#E8D0D8" />
        </radialGradient>

        <radialGradient id="sonny-koala-nose" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#3A3A3A" />
          <stop offset="100%" stopColor="#2A2A2A" />
        </radialGradient>

        {/* ===== LION GRADIENTS ===== */}

        <radialGradient id="sonny-lion-mane-inner" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#8B5E3C" />
          <stop offset="100%" stopColor="#7A4E2C" />
        </radialGradient>

        <radialGradient id="sonny-lion-mane-mid" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#C4884A" />
          <stop offset="100%" stopColor="#B07840" />
        </radialGradient>

        <radialGradient id="sonny-lion-mane-outer" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8B060" />
          <stop offset="100%" stopColor="#D4A050" />
        </radialGradient>

        <radialGradient id="sonny-lion-base" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D4A56A" />
          <stop offset="100%" stopColor="#C49558" />
        </radialGradient>

        {/* ===== EXISTING VARIANT UPGRADE GRADIENTS ===== */}

        <radialGradient id="sonny-bunny-base" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4AAC4" />
          <stop offset="100%" stopColor="#DE86A8" />
        </radialGradient>

        <radialGradient id="sonny-strawberry-base" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF6B8A" />
          <stop offset="100%" stopColor="#E8456A" />
        </radialGradient>

        <radialGradient id="sonny-cat-base" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4AAC4" />
          <stop offset="100%" stopColor="#DE86A8" />
        </radialGradient>

        <radialGradient id="sonny-bear-base" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#D4956A" />
          <stop offset="100%" stopColor="#B8794E" />
        </radialGradient>

        <radialGradient id="sonny-duck-base" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFD93D" />
          <stop offset="100%" stopColor="#F5C518" />
        </radialGradient>

        <radialGradient id="sonny-flower-base" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFC8DD" />
          <stop offset="100%" stopColor="#FF8FAB" />
        </radialGradient>

        {/* ===== SHARED FILTER ===== */}

        <filter id="sonny-soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feOffset in="blur" dx="1" dy="2" result="offsetBlur" />
          <feFlood floodColor="#000000" floodOpacity="0.1" result="color" />
          <feComposite in="color" in2="offsetBlur" operator="in" result="shadow" />
          <feMerge>
            <feMergeNode in="shadow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

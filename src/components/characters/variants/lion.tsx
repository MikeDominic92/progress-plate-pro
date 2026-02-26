const lion = {
  headgear: (
    <>
      {/* ===== SUN-LIKE RADIATING MANE ===== */}

      {/* Outer mane ring -- scalloped bumps radiating outward like a sun */}
      <path
        d="M 50 -8
           C 58 -10 62 -14 66 -8 C 70 -2 74 -6 78 0
           C 82 6 88 4 90 12 C 92 20 96 20 96 28
           C 96 36 100 38 98 46 C 96 54 98 58 94 62
           C 90 66 90 70 84 70 C 78 70 76 74 70 72
           C 64 70 62 74 56 70 C 52 68 48 68 44 70
           C 38 74 36 70 30 72 C 24 74 22 70 16 70
           C 10 70 10 66 6 62 C 2 58 4 54 2 46
           C 0 38 4 36 4 28 C 4 20 8 20 10 12
           C 12 4 18 6 22 0 C 26 -6 30 -2 34 -8
           C 38 -14 42 -10 50 -8 Z"
        fill="url(#sonny-lion-mane-outer)"
        stroke="#C08030"
        strokeWidth="0.8"
      />

      {/* Middle mane ring -- slightly smaller scalloped shape */}
      <path
        d="M 50 -2
           C 56 -4 60 -6 64 -2 C 68 2 72 0 74 6
           C 76 12 80 12 82 18 C 84 24 88 26 86 32
           C 84 38 88 42 84 46 C 80 50 82 54 78 56
           C 74 58 72 62 66 60 C 60 58 56 62 50 60
           C 44 62 40 58 34 60 C 28 62 26 58 22 56
           C 18 54 20 50 16 46 C 12 42 16 38 14 32
           C 12 26 16 24 18 18 C 20 12 24 12 26 6
           C 28 0 32 2 36 -2 C 40 -6 44 -4 50 -2 Z"
        fill="url(#sonny-lion-mane-mid)"
      />

      {/* Inner mane glow */}
      <path
        d="M 50 6
           C 56 4 60 2 64 6 C 68 10 72 10 72 16
           C 72 22 76 24 74 30 C 72 36 76 40 72 44
           C 68 48 66 52 60 50 C 54 48 50 52 44 50
           C 38 52 34 48 28 44 C 24 40 28 36 26 30
           C 24 24 28 22 28 16 C 28 10 32 10 36 6
           C 40 2 44 4 50 6 Z"
        fill="url(#sonny-lion-mane-inner)"
      />

      {/* ===== GOLDEN CAP on top of head ===== */}
      <path
        d="M 16 62 Q 16 44 22 34 Q 30 20 50 16 Q 70 20 78 34 Q 84 44 84 62 Z"
        fill="url(#sonny-lion-base)"
        stroke="#B08840"
        strokeWidth="1"
      />

      {/* Small round ears poking above mane */}
      <circle cx="26" cy="10" r="8" fill="url(#sonny-lion-mane-mid)" stroke="#B08840" strokeWidth="0.8" />
      <circle cx="26" cy="10" r="4.5" fill="url(#sonny-lion-mane-inner)" opacity="0.6" />
      <circle cx="74" cy="10" r="8" fill="url(#sonny-lion-mane-mid)" stroke="#B08840" strokeWidth="0.8" />
      <circle cx="74" cy="10" r="4.5" fill="url(#sonny-lion-mane-inner)" opacity="0.6" />

    </>
  ),
  foreheadCover: <path d="M 18 64 Q 22 34 50 30 Q 78 34 82 64 Z" fill="#D4A56A" />,
  face: (
    <>
      {/* Lion eyes on cap */}
      <circle cx="38" cy="36" r="3.5" fill="#2e1e1e" />
      <circle cx="39" cy="35" r="1.2" fill="white" opacity="0.9" />
      <circle cx="62" cy="36" r="3.5" fill="#2e1e1e" />
      <circle cx="63" cy="35" r="1.2" fill="white" opacity="0.9" />
      {/* Triangle nose */}
      <path d="M 47 44 L 50 48 L 53 44 Z" fill="#A07030" stroke="#8B6020" strokeWidth="0.6" />
      <ellipse cx="50" cy="45" rx="1.5" ry="0.8" fill="white" opacity="0.2" />
      {/* Mouth */}
      <path d="M 46 49 Q 50 53 54 49" fill="none" stroke="#8B6020" strokeWidth="0.8" strokeLinecap="round" />
      {/* Whisker dots */}
      <circle cx="32" cy="46" r="1" fill="#B08840" opacity="0.25" />
      <circle cx="30" cy="50" r="1" fill="#B08840" opacity="0.2" />
      <circle cx="33" cy="54" r="1" fill="#B08840" opacity="0.15" />
      <circle cx="68" cy="46" r="1" fill="#B08840" opacity="0.25" />
      <circle cx="70" cy="50" r="1" fill="#B08840" opacity="0.2" />
      <circle cx="67" cy="54" r="1" fill="#B08840" opacity="0.15" />
    </>
  ),
  wings: (
    <>
      {/* Blue bowtie at neck */}
      <path d="M 38 86 L 47 82 L 47 90 Z" fill="#4A90D9" stroke="#3A78C0" strokeWidth="0.6" />
      <path d="M 62 86 L 53 82 L 53 90 Z" fill="#4A90D9" stroke="#3A78C0" strokeWidth="0.6" />
      <circle cx="50" cy="86" r="3" fill="#3A78C0" stroke="#2A68B0" strokeWidth="0.6" />

      {/* Simple blue vest panels */}
      <path d="M 30 90 Q 36 88 42 90 L 40 114 Q 36 116 30 114 Z" fill="#4A90D9" stroke="#3A78C0" strokeWidth="0.5" opacity="0.85" />
      <path d="M 70 90 Q 64 88 58 90 L 60 114 Q 64 116 70 114 Z" fill="#4A90D9" stroke="#3A78C0" strokeWidth="0.5" opacity="0.85" />
      {/* Vest buttons */}
      <circle cx="50" cy="98" r="1.5" fill="#2A68B0" opacity="0.6" />
      <circle cx="50" cy="106" r="1.5" fill="#2A68B0" opacity="0.6" />
    </>
  ),
}

export default lion

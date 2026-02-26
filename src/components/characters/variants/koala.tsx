const koala = {
  headgear: (
    <>
      {/* Rounded gray cap - extra chubby */}
      <path
        d="M 10 62 Q 10 40 18 30 Q 28 16 50 12 Q 72 16 82 30 Q 90 40 90 62 Z"
        fill="url(#sonny-koala-base)"
        stroke="#7A7A7A"
        strokeWidth="1"
      />

      {/* Fur texture bumps along the bottom cap edge */}
      <path
        d="M 16 60 C 18 58 20 60 22 58 C 24 56 26 58 28 56 C 30 54 32 56 34 54 C 36 52 38 54 40 52 C 42 50 44 52 46 50 C 48 48 50 50 52 48 C 54 50 56 48 58 50 C 60 52 62 50 64 52 C 66 54 68 52 70 54 C 72 56 74 54 76 56 C 78 58 80 56 82 58 C 84 60 86 58 86 62"
        fill="none"
        stroke="#C0C0C0"
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.15"
      />

      {/* Left ear - very large and round with fuzzy edge */}
      <path
        d="M 22 36 C 20 18 10 14 2 16 C -6 18 -12 24 -14 34 C -16 44 -10 54 0 56 C 8 58 16 52 20 44 C 22 40 22 38 22 36 Z
           M 22 36 C 21 34 19 32 18 34 C 17 36 19 38 20 36
           M 6 18 C 4 16 2 18 4 20
           M -8 28 C -10 26 -12 28 -10 30
           M -10 42 C -12 40 -14 42 -12 44
           M 2 54 C 0 52 -2 54 0 56"
        fill="url(#sonny-koala-base)"
        stroke="#7A7A7A"
        strokeWidth="0.8"
      />
      {/* Left ear inner */}
      <ellipse
        cx="4"
        cy="36"
        rx="10"
        ry="12"
        fill="url(#sonny-koala-inner-ear)"
      />
      {/* Left ear fur tufts */}
      <path d="M 0 20 C -2 16 -1 14 1 16" fill="none" stroke="#9A9A9A" strokeWidth="0.6" strokeLinecap="round" opacity="0.3" />
      <path d="M 4 18 C 2 14 3 12 5 14" fill="none" stroke="#9A9A9A" strokeWidth="0.6" strokeLinecap="round" opacity="0.3" />
      <path d="M 8 20 C 6 16 7 14 9 16" fill="none" stroke="#9A9A9A" strokeWidth="0.6" strokeLinecap="round" opacity="0.3" />
      <path d="M -4 24 C -6 20 -5 18 -3 20" fill="none" stroke="#9A9A9A" strokeWidth="0.5" strokeLinecap="round" opacity="0.25" />

      {/* Right ear - very large and round with fuzzy edge (mirrored) */}
      <path
        d="M 78 36 C 80 18 90 14 98 16 C 106 18 112 24 114 34 C 116 44 110 54 100 56 C 92 58 84 52 80 44 C 78 40 78 38 78 36 Z
           M 78 36 C 79 34 81 32 82 34 C 83 36 81 38 80 36
           M 94 18 C 96 16 98 18 96 20
           M 108 28 C 110 26 112 28 110 30
           M 110 42 C 112 40 114 42 112 44
           M 98 54 C 100 52 102 54 100 56"
        fill="url(#sonny-koala-base)"
        stroke="#7A7A7A"
        strokeWidth="0.8"
      />
      {/* Right ear inner */}
      <ellipse
        cx="96"
        cy="36"
        rx="10"
        ry="12"
        fill="url(#sonny-koala-inner-ear)"
      />
      {/* Right ear fur tufts */}
      <path d="M 100 20 C 102 16 101 14 99 16" fill="none" stroke="#9A9A9A" strokeWidth="0.6" strokeLinecap="round" opacity="0.3" />
      <path d="M 96 18 C 98 14 97 12 95 14" fill="none" stroke="#9A9A9A" strokeWidth="0.6" strokeLinecap="round" opacity="0.3" />
      <path d="M 92 20 C 94 16 93 14 91 16" fill="none" stroke="#9A9A9A" strokeWidth="0.6" strokeLinecap="round" opacity="0.3" />
      <path d="M 104 24 C 106 20 105 18 103 20" fill="none" stroke="#9A9A9A" strokeWidth="0.5" strokeLinecap="round" opacity="0.25" />

      {/* Chubby cheek puffs */}
      <ellipse cx="24" cy="50" rx="10" ry="6" fill="#C0C0C0" opacity="0.2" />
      <ellipse cx="76" cy="50" rx="10" ry="6" fill="#C0C0C0" opacity="0.2" />

      {/* Eucalyptus leaf near right ear */}
      <g transform="translate(78, 22) rotate(15)">
        {/* Stem */}
        <line x1="0" y1="0" x2="0" y2="12" stroke="#4A8A4A" strokeWidth="0.8" strokeLinecap="round" />
        {/* Upper leaf */}
        <path
          d="M 0 2 C 4 0 6 2 4 5 C 2 8 0 6 0 4 Z"
          fill="#66BB6A"
          stroke="#4A8A4A"
          strokeWidth="0.4"
        />
        {/* Lower leaf */}
        <path
          d="M 0 7 C -4 5 -6 7 -4 10 C -2 13 0 11 0 9 Z"
          fill="#66BB6A"
          stroke="#4A8A4A"
          strokeWidth="0.4"
        />
      </g>
    </>
  ),
  foreheadCover: <path d="M 12 64 Q 14 30 50 28 Q 86 30 88 64 Z" fill="#A5A5A5" />,
  face: (
    <>
      {/* Koala eyes on cap */}
      <circle cx="36" cy="34" r="3.5" fill="#2e1e1e" />
      <circle cx="37" cy="33" r="1.2" fill="white" opacity="0.9" />
      <circle cx="64" cy="34" r="3.5" fill="#2e1e1e" />
      <circle cx="65" cy="33" r="1.2" fill="white" opacity="0.9" />
      {/* Koala nose -- BIG wide black oval */}
      <ellipse cx="50" cy="44" rx="8" ry="5.5" fill="#1A1A1A" stroke="#0A0A0A" strokeWidth="0.5" />
      <ellipse cx="47" cy="42" rx="2.5" ry="1.5" fill="white" opacity="0.25" />
      <circle cx="46" cy="45" r="1.2" fill="#0A0A0A" opacity="0.5" />
      <circle cx="54" cy="45" r="1.2" fill="#0A0A0A" opacity="0.5" />
      {/* Little smile */}
      <path d="M 46 50 Q 50 53 54 50" fill="none" stroke="#5A5A5A" strokeWidth="0.6" strokeLinecap="round" opacity="0.4" />
    </>
  ),
  wings: null,
}

export default koala

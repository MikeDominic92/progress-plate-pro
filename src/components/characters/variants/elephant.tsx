const elephant = {
  headgear: (
    <>
      {/* ===== ELEPHANT CAP -- extra wide to match big body ===== */}
      <path
        d="M 8 62 Q 8 40 16 28 Q 26 12 50 8 Q 74 12 84 28 Q 92 40 92 62 Z"
        fill="url(#sonny-elephant-base)"
        stroke="#5A8FAF"
        strokeWidth="1"
      />

      {/* Left ear -- HUGE floppy elephant ear extending far out */}
      <path
        d="M 14 38 C 8 30 -14 18 -26 24 C -36 30 -40 48 -32 58 C -24 68 -6 66 6 58 C 12 52 14 46 14 40 Z"
        fill="url(#sonny-elephant-base)"
        stroke="#5A8FAF"
        strokeWidth="0.8"
      />
      {/* Left ear inner -- yellow */}
      <path
        d="M 10 42 C 4 34 -10 26 -20 30 C -28 36 -30 48 -24 56 C -18 62 -4 60 4 54 C 8 50 10 46 10 42 Z"
        fill="url(#sonny-elephant-inner-ear)"
      />
      {/* Left ear wrinkle */}
      <path d="M 6 42 C 0 36 -8 32 -14 36" fill="none" stroke="#5A8FAF" strokeWidth="0.5" strokeLinecap="round" opacity="0.15" />

      {/* Right ear -- HUGE floppy elephant ear extending far out */}
      <path
        d="M 86 38 C 92 30 114 18 126 24 C 136 30 140 48 132 58 C 124 68 106 66 94 58 C 88 52 86 46 86 40 Z"
        fill="url(#sonny-elephant-base)"
        stroke="#5A8FAF"
        strokeWidth="0.8"
      />
      {/* Right ear inner -- yellow */}
      <path
        d="M 90 42 C 96 34 110 26 120 30 C 128 36 130 48 124 56 C 118 62 104 60 96 54 C 92 50 90 46 90 42 Z"
        fill="url(#sonny-elephant-inner-ear)"
      />
      {/* Right ear wrinkle */}
      <path d="M 94 42 C 100 36 108 32 114 36" fill="none" stroke="#5A8FAF" strokeWidth="0.5" strokeLinecap="round" opacity="0.15" />

      {/* Trunk on top of head -- curving up proudly */}
      <path
        d="M 46 14 C 46 8 47 0 48 -8 C 49 -16 52 -22 56 -26 C 60 -22 62 -16 60 -8 C 58 0 56 8 54 14"
        fill="url(#sonny-elephant-base)"
        stroke="#5A8FAF"
        strokeWidth="0.8"
      />
      {/* Trunk tip curl */}
      <path
        d="M 56 -26 C 60 -30 64 -28 62 -24"
        fill="none"
        stroke="#5A8FAF"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Trunk wrinkle lines */}
      <path d="M 47 4 Q 50 3 53 4" fill="none" stroke="#5A8FAF" strokeWidth="0.5" strokeLinecap="round" opacity="0.15" />
      <path d="M 47.5 -2 Q 50.5 -3 53 -2" fill="none" stroke="#5A8FAF" strokeWidth="0.5" strokeLinecap="round" opacity="0.15" />
      <path d="M 48 -10 Q 51 -11 54 -10" fill="none" stroke="#5A8FAF" strokeWidth="0.5" strokeLinecap="round" opacity="0.15" />

      {/* Forehead seam */}
      <path d="M 26 38 Q 50 34 74 38" fill="none" stroke="#5A8FAF" strokeWidth="0.4" strokeLinecap="round" opacity="0.1" />
    </>
  ),
  foreheadCover: <path d="M 10 64 Q 14 30 50 26 Q 86 30 90 64 Z" fill="#87CEEB" />,
  face: (
    <>
      {/* Elephant eyes on cap */}
      <circle cx="34" cy="34" r="3.5" fill="#2e1e1e" />
      <circle cx="35" cy="33" r="1.2" fill="white" opacity="0.9" />
      <circle cx="66" cy="34" r="3.5" fill="#2e1e1e" />
      <circle cx="67" cy="33" r="1.2" fill="white" opacity="0.9" />
      {/* Tiny smile */}
      <path d="M 44 46 Q 50 50 56 46" fill="none" stroke="#5A8FAF" strokeWidth="0.7" strokeLinecap="round" opacity="0.4" />
      {/* Chubby cheeks */}
      <ellipse cx="24" cy="50" rx="8" ry="5" fill="#87CEEB" opacity="0.15" />
      <ellipse cx="76" cy="50" rx="8" ry="5" fill="#87CEEB" opacity="0.15" />
    </>
  ),
  wings: null,
}

export default elephant

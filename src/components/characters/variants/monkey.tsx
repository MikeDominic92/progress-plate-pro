const monkey = {
  headgear: (
    <>
      {/* ===== GREEN BANANA PEEL HOOD ===== */}

      {/* Banana peel outer -- wraps around head like a hood */}
      <path
        d="M 14 62 Q 10 40 16 24 Q 24 6 50 0 Q 76 6 84 24 Q 90 40 86 62 Z"
        fill="#4CAF50"
        stroke="#388E3C"
        strokeWidth="1"
      />

      {/* Peel left flap -- peeled open */}
      <path
        d="M 18 50 C 12 44 2 38 -6 40 C -12 42 -10 50 -4 54 C 2 58 12 56 18 52 Z"
        fill="#66BB6A"
        stroke="#388E3C"
        strokeWidth="0.7"
      />
      {/* Left flap inner */}
      <path
        d="M 16 50 C 12 46 4 42 0 44 C -4 46 -2 50 2 52 C 6 54 12 53 16 51 Z"
        fill="#A5D6A7"
        opacity="0.6"
      />

      {/* Peel right flap -- peeled open */}
      <path
        d="M 82 50 C 88 44 98 38 106 40 C 112 42 110 50 104 54 C 98 58 88 56 82 52 Z"
        fill="#66BB6A"
        stroke="#388E3C"
        strokeWidth="0.7"
      />
      {/* Right flap inner */}
      <path
        d="M 84 50 C 88 46 96 42 100 44 C 104 46 102 50 98 52 C 94 54 88 53 84 51 Z"
        fill="#A5D6A7"
        opacity="0.6"
      />

      {/* Banana peel texture lines */}
      <path d="M 30 10 Q 50 6 70 10" fill="none" stroke="#388E3C" strokeWidth="0.5" opacity="0.2" />
      <path d="M 24 20 Q 50 14 76 20" fill="none" stroke="#388E3C" strokeWidth="0.5" opacity="0.15" />
      <path d="M 20 32 Q 50 26 80 32" fill="none" stroke="#388E3C" strokeWidth="0.4" opacity="0.1" />

      {/* Banana stem on top */}
      <path
        d="M 48 2 Q 46 -8 50 -14 Q 52 -10 54 -6 Q 52 0 52 2 Z"
        fill="#2E7D32"
        stroke="#1B5E20"
        strokeWidth="0.6"
      />
      <ellipse cx="50" cy="-14" rx="3" ry="2" fill="#1B5E20" />

      {/* Brown monkey ears poking out */}
      <circle cx="10" cy="42" r="12" fill="#8D6E63" stroke="#6D4C41" strokeWidth="0.8" />
      <circle cx="10" cy="42" r="7" fill="#BCAAA4" opacity="0.5" />
      <circle cx="90" cy="42" r="12" fill="#8D6E63" stroke="#6D4C41" strokeWidth="0.8" />
      <circle cx="90" cy="42" r="7" fill="#BCAAA4" opacity="0.5" />

      {/* Hood edge along face -- scalloped bottom */}
      <path
        d="M 18 56 Q 20 60 26 62 Q 34 60 38 62 Q 44 60 50 62 Q 56 60 62 62 Q 66 60 74 62 Q 80 60 82 56"
        fill="none"
        stroke="#388E3C"
        strokeWidth="0.8"
        opacity="0.3"
      />

    </>
  ),
  foreheadCover: <path d="M 16 64 Q 18 34 50 28 Q 82 34 84 64 Z" fill="#4CAF50" />,
  face: (
    <>
      {/* Monkey eyes on cap */}
      <circle cx="38" cy="34" r="3.5" fill="#2e1e1e" />
      <circle cx="39" cy="33" r="1.2" fill="white" opacity="0.9" />
      <circle cx="62" cy="34" r="3.5" fill="#2e1e1e" />
      <circle cx="63" cy="33" r="1.2" fill="white" opacity="0.9" />
      <ellipse cx="50" cy="44" rx="5" ry="3" fill="#6D4C41" />
      <circle cx="46" cy="44" r="1.2" fill="#3E2723" opacity="0.6" />
      <circle cx="54" cy="44" r="1.2" fill="#3E2723" opacity="0.6" />
      <path d="M 44 48 Q 50 52 56 48" fill="none" stroke="#5D4037" strokeWidth="0.8" strokeLinecap="round" />
    </>
  ),
  wings: (
    <>
      {/* Green banana leaves draped over shoulders */}
      <path
        d="M 28 84 C 22 78 12 76 4 80 C -2 84 0 92 6 95 C 12 98 22 94 26 88 Z"
        fill="#66BB6A"
        stroke="#4CAF50"
        strokeWidth="0.7"
        opacity="0.9"
      />
      <path d="M 26 86 C 18 82 8 84" fill="none" stroke="#388E3C" strokeWidth="0.5" opacity="0.3" />
      <path d="M 24 88 C 16 86 6 88" fill="none" stroke="#388E3C" strokeWidth="0.4" opacity="0.2" />
      <path
        d="M 72 84 C 78 78 88 76 96 80 C 102 84 100 92 94 95 C 88 98 78 94 74 88 Z"
        fill="#66BB6A"
        stroke="#4CAF50"
        strokeWidth="0.7"
        opacity="0.9"
      />
      <path d="M 74 86 C 82 82 92 84" fill="none" stroke="#388E3C" strokeWidth="0.5" opacity="0.3" />
      <path d="M 76 88 C 84 86 94 88" fill="none" stroke="#388E3C" strokeWidth="0.4" opacity="0.2" />

      {/* Monkey tail -- long spiral curl */}
      <path
        d="M 74 108 C 80 104 88 98 92 90
           C 96 82 98 74 94 68
           C 90 62 84 64 82 70
           C 80 76 84 82 88 78
           C 92 74 94 66 90 60
           C 86 54 80 56 78 62
           C 76 68 80 74 76 78
           C 72 82 68 86 72 92
           C 74 96 76 102 74 108 Z"
        fill="#8D6E63"
        stroke="#6D4C41"
        strokeWidth="0.8"
        opacity="0.85"
      />
      {/* Tail tip curl */}
      <circle cx="90" cy="58" r="3" fill="#8D6E63" stroke="#6D4C41" strokeWidth="0.6" opacity="0.85" />
    </>
  ),
}

export default monkey

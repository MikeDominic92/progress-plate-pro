import { memo, useEffect, useState } from 'react'
import elephantVariant from './variants/elephant'
import koalaVariant from './variants/koala'
import lionVariant from './variants/lion'
import monkeyVariant from './variants/monkey'

export type SonnyVariant =
  | 'bunny'
  | 'strawberry'
  | 'cat'
  | 'bear'
  | 'duck'
  | 'flower'
  | 'elephant'
  | 'koala'
  | 'lion'
  | 'monkey'

interface SonnyAngelProps {
  size?: number
  className?: string
  variant?: SonnyVariant
  alwaysClosed?: boolean
}

/* ============================================================
 * Animation class lookup
 * ============================================================ */
const animClass: Record<SonnyVariant, string> = {
  bunny: 'sonny-hoppy',
  strawberry: 'sonny-twirl',
  cat: 'sonny-pounce',
  bear: 'sonny-sleepy',
  duck: 'sonny-waddle',
  flower: 'sonny-bloom',
  elephant: 'sonny-stomp',
  koala: 'sonny-cling',
  lion: 'sonny-strut',
  monkey: 'sonny-swing',
}

/* ============================================================
 * Headgear map
 * ============================================================ */
const headgear: Record<SonnyVariant, React.ReactNode> = {
  bunny: (
    <>
      <ellipse cx="32" cy="8" rx="11" ry="34" fill="#f4aac4" stroke="#de86a8" strokeWidth="1.2" transform="rotate(-12 32 8)" />
      <ellipse cx="32" cy="8" rx="6.5" ry="24" fill="#ffd6e8" transform="rotate(-12 32 8)" />
      <ellipse cx="68" cy="8" rx="11" ry="34" fill="#f4aac4" stroke="#de86a8" strokeWidth="1.2" transform="rotate(12 68 8)" />
      <ellipse cx="68" cy="8" rx="6.5" ry="24" fill="#ffd6e8" transform="rotate(12 68 8)" />
      <path d="M 14 62 Q 16 28 50 24 Q 84 28 86 62 Z" fill="#f4aac4" stroke="#de86a8" strokeWidth="1" />
      <path d="M 26 48 Q 50 44 74 48" fill="none" stroke="#ffd6e8" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </>
  ),
  strawberry: (
    <>
      <path
        d="M 20 58 C 12 42 16 20 28 8 Q 38 -2 50 -4 Q 62 -2 72 8 C 84 20 88 42 80 58 Z"
        fill="#D42B4A"
        stroke="#B81D3C"
        strokeWidth="1.2"
      />
      <path
        d="M 32 48 C 28 36 30 20 38 12 Q 44 4 50 2 Q 56 4 62 12 C 70 20 72 36 68 48 Z"
        fill="#E83858"
        opacity="0.25"
      />
      <path d="M 14 62 Q 22 50 50 46 Q 78 50 86 62 Z" fill="#D42B4A" stroke="#B81D3C" strokeWidth="1" />
      <ellipse cx="40" cy="12" rx="1.2" ry="1.8" fill="#FFDD44" opacity="0.7" transform="rotate(-8 40 12)" />
      <ellipse cx="60" cy="12" rx="1.2" ry="1.8" fill="#FFDD44" opacity="0.7" transform="rotate(8 60 12)" />
      <ellipse cx="32" cy="22" rx="1.2" ry="1.8" fill="#FFDD44" opacity="0.7" transform="rotate(-12 32 22)" />
      <ellipse cx="50" cy="20" rx="1.2" ry="1.8" fill="#FFDD44" opacity="0.7" />
      <ellipse cx="68" cy="22" rx="1.2" ry="1.8" fill="#FFDD44" opacity="0.7" transform="rotate(12 68 22)" />
      <ellipse cx="26" cy="34" rx="1.2" ry="1.8" fill="#FFDD44" opacity="0.65" transform="rotate(-18 26 34)" />
      <ellipse cx="42" cy="32" rx="1.2" ry="1.8" fill="#FFDD44" opacity="0.65" transform="rotate(-5 42 32)" />
      <ellipse cx="58" cy="32" rx="1.2" ry="1.8" fill="#FFDD44" opacity="0.65" transform="rotate(5 58 32)" />
      <ellipse cx="74" cy="34" rx="1.2" ry="1.8" fill="#FFDD44" opacity="0.65" transform="rotate(18 74 34)" />
      <ellipse cx="34" cy="44" rx="1.2" ry="1.8" fill="#FFDD44" opacity="0.6" transform="rotate(-12 34 44)" />
      <ellipse cx="50" cy="42" rx="1.2" ry="1.8" fill="#FFDD44" opacity="0.6" />
      <ellipse cx="66" cy="44" rx="1.2" ry="1.8" fill="#FFDD44" opacity="0.6" transform="rotate(12 66 44)" />
      <path d="M 36 4 Q 42 16 50 2 Q 58 16 64 4" fill="#66BB6A" stroke="#388E3C" strokeWidth="1.5" />
      <path d="M 40 6 Q 34 0 30 6" fill="#4CAF50" stroke="#388E3C" strokeWidth="0.8" opacity="0.6" />
      <path d="M 60 6 Q 66 0 70 6" fill="#4CAF50" stroke="#388E3C" strokeWidth="0.8" opacity="0.6" />
      <line x1="50" y1="2" x2="50" y2="-10" stroke="#388E3C" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M 26 52 Q 50 48 74 52" fill="none" stroke="#B81D3C" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </>
  ),
  cat: (
    <>
      <path d="M 22 46 L 14 2 L 42 38 Z" fill="#f4aac4" stroke="#de86a8" strokeWidth="1.2" />
      <path d="M 26 40 L 20 12 L 38 36 Z" fill="#ffd6e8" />
      <path d="M 78 46 L 86 2 L 58 38 Z" fill="#f4aac4" stroke="#de86a8" strokeWidth="1.2" />
      <path d="M 74 40 L 80 12 L 62 36 Z" fill="#ffd6e8" />
      <path d="M 14 62 Q 16 32 50 28 Q 84 32 86 62 Z" fill="#f4aac4" stroke="#de86a8" strokeWidth="1" />
      <path d="M 26 50 Q 50 46 74 50" fill="none" stroke="#ffd6e8" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </>
  ),
  bear: (
    <>
      <circle cx="16" cy="32" r="18" fill="#d4956a" stroke="#b8794e" strokeWidth="1.2" />
      <circle cx="16" cy="32" r="11" fill="#e8b088" />
      <circle cx="84" cy="32" r="18" fill="#d4956a" stroke="#b8794e" strokeWidth="1.2" />
      <circle cx="84" cy="32" r="11" fill="#e8b088" />
      <path d="M 10 62 Q 12 30 50 26 Q 88 30 90 62 Z" fill="#d4956a" stroke="#b8794e" strokeWidth="1" />
      <ellipse cx="24" cy="52" rx="10" ry="6" fill="#e8b088" opacity="0.3" />
      <ellipse cx="76" cy="52" rx="10" ry="6" fill="#e8b088" opacity="0.3" />
      <path d="M 22 50 Q 50 46 78 50" fill="none" stroke="#e8b088" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </>
  ),
  duck: (
    <>
      <path d="M 16 62 Q 20 36 50 32 Q 80 36 84 62 Z" fill="#FFD93D" stroke="#F5C518" strokeWidth="1" />
      <path d="M 26 50 Q 50 46 74 50" fill="none" stroke="#FFE566" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <ellipse cx="50" cy="28" rx="28" ry="26" fill="#FFD93D" stroke="#F5C518" strokeWidth="1.2" />
      <ellipse cx="50" cy="14" rx="8" ry="6" fill="#FFE566" />
      <path d="M 36 28 Q 43 30 50 32 Q 57 30 64 28 L 64 31 Q 57 35 50 36 Q 43 35 36 31 Z" fill="#FF8C00" stroke="#E07000" strokeWidth="0.8" />
      <circle cx="40" cy="22" r="3.5" fill="#2e1e1e" />
      <circle cx="41" cy="21" r="1.2" fill="white" opacity="0.9" />
      <circle cx="60" cy="22" r="3.5" fill="#2e1e1e" />
      <circle cx="61" cy="21" r="1.2" fill="white" opacity="0.9" />
    </>
  ),
  flower: (
    <>
      <path d="M 16 62 Q 20 38 50 34 Q 80 38 84 62 Z" fill="#ffc8dd" stroke="#ff8fab" strokeWidth="0.8" />
      <path d="M 26 52 Q 50 48 74 52" fill="none" stroke="#ffb3d1" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
      <circle cx="26" cy="34" r="8" fill="#ff8fab" stroke="#ff6b8a" strokeWidth="0.8" />
      <circle cx="26" cy="34" r="4" fill="#ffdd44" />
      <circle cx="50" cy="24" r="10" fill="#ffb3d1" stroke="#ff8fab" strokeWidth="0.8" />
      <circle cx="50" cy="24" r="5" fill="#ffdd44" />
      <circle cx="74" cy="34" r="8" fill="#ff8fab" stroke="#ff6b8a" strokeWidth="0.8" />
      <circle cx="74" cy="34" r="4" fill="#ffdd44" />
      <circle cx="38" cy="27" r="7" fill="#ffc8dd" stroke="#ff8fab" strokeWidth="0.8" />
      <circle cx="38" cy="27" r="3.5" fill="#ffdd44" />
      <circle cx="62" cy="27" r="7" fill="#ffc8dd" stroke="#ff8fab" strokeWidth="0.8" />
      <circle cx="62" cy="27" r="3.5" fill="#ffdd44" />
      <ellipse cx="34" cy="40" rx="5" ry="2.5" fill="#66BB6A" transform="rotate(-25 34 40)" opacity="0.6" />
      <ellipse cx="66" cy="40" rx="5" ry="2.5" fill="#66BB6A" transform="rotate(25 66 40)" opacity="0.6" />
    </>
  ),
  elephant: elephantVariant.headgear,
  koala: koalaVariant.headgear,
  lion: lionVariant.headgear,
  monkey: monkeyVariant.headgear,
}

/* ============================================================
 * Forehead cover map (covers top of head with hat colour)
 * ============================================================ */
const foreheadCover: Record<SonnyVariant, React.ReactNode> = {
  bunny: <path d="M 16 64 Q 20 34 50 32 Q 80 34 84 64 Z" fill="#f4aac4" />,
  strawberry: <path d="M 16 64 Q 22 42 50 38 Q 78 42 84 64 Z" fill="#D42B4A" />,
  cat: <path d="M 16 64 Q 20 34 50 32 Q 80 34 84 64 Z" fill="#f4aac4" />,
  bear: <path d="M 12 64 Q 16 30 50 28 Q 84 30 88 64 Z" fill="#d4956a" />,
  duck: <path d="M 16 64 Q 20 34 50 32 Q 80 34 84 64 Z" fill="#FFD93D" />,
  flower: <path d="M 16 64 Q 20 34 50 32 Q 80 34 84 64 Z" fill="#ffc8dd" />,
  elephant: elephantVariant.foreheadCover,
  koala: koalaVariant.foreheadCover,
  lion: lionVariant.foreheadCover,
  monkey: monkeyVariant.foreheadCover,
}

/* ============================================================
 * Headgear face map (rendered AFTER foreheadCover so faces show)
 * ============================================================ */
const headgearFace: Record<SonnyVariant, React.ReactNode> = {
  bunny: null,
  strawberry: (
    <>
      <circle cx="40" cy="28" r="3.5" fill="#2e1e1e" />
      <circle cx="41" cy="27" r="1.2" fill="white" opacity="0.9" />
      <circle cx="60" cy="28" r="3.5" fill="#2e1e1e" />
      <circle cx="61" cy="27" r="1.2" fill="white" opacity="0.9" />
      <path d="M 46 36 Q 50 39 54 36" fill="none" stroke="#B81D3C" strokeWidth="0.8" strokeLinecap="round" />
    </>
  ),
  cat: (
    <>
      <circle cx="38" cy="38" r="3.5" fill="#2e1e1e" />
      <circle cx="39" cy="37" r="1.2" fill="white" opacity="0.9" />
      <circle cx="62" cy="38" r="3.5" fill="#2e1e1e" />
      <circle cx="63" cy="37" r="1.2" fill="white" opacity="0.9" />
      <path d="M 48 46 L 50 48 L 52 46" fill="#de86a8" stroke="#c77090" strokeWidth="0.6" />
      <path d="M 47 49 Q 50 51 53 49" fill="none" stroke="#c77090" strokeWidth="0.6" strokeLinecap="round" />
      <path d="M 36 44 L 24 42" fill="none" stroke="#de86a8" strokeWidth="0.5" opacity="0.3" />
      <path d="M 36 46 L 24 47" fill="none" stroke="#de86a8" strokeWidth="0.5" opacity="0.3" />
      <path d="M 36 48 L 24 52" fill="none" stroke="#de86a8" strokeWidth="0.5" opacity="0.3" />
      <path d="M 64 44 L 76 42" fill="none" stroke="#de86a8" strokeWidth="0.5" opacity="0.3" />
      <path d="M 64 46 L 76 47" fill="none" stroke="#de86a8" strokeWidth="0.5" opacity="0.3" />
      <path d="M 64 48 L 76 52" fill="none" stroke="#de86a8" strokeWidth="0.5" opacity="0.3" />
    </>
  ),
  bear: (
    <>
      <circle cx="38" cy="38" r="3.5" fill="#2e1e1e" />
      <circle cx="39" cy="37" r="1.2" fill="white" opacity="0.9" />
      <circle cx="62" cy="38" r="3.5" fill="#2e1e1e" />
      <circle cx="63" cy="37" r="1.2" fill="white" opacity="0.9" />
      <ellipse cx="50" cy="46" rx="5" ry="3.5" fill="#b8794e" />
      <circle cx="49" cy="45" r="1" fill="white" opacity="0.3" />
      <path d="M 47 49 Q 50 52 53 49" fill="none" stroke="#8B5E3C" strokeWidth="0.8" strokeLinecap="round" />
    </>
  ),
  duck: null,
  flower: (
    <>
      <circle cx="40" cy="40" r="3.5" fill="#2e1e1e" />
      <circle cx="41" cy="39" r="1.2" fill="white" opacity="0.9" />
      <circle cx="60" cy="40" r="3.5" fill="#2e1e1e" />
      <circle cx="61" cy="39" r="1.2" fill="white" opacity="0.9" />
      <path d="M 46 48 Q 50 51 54 48" fill="none" stroke="#d46a8a" strokeWidth="0.7" strokeLinecap="round" />
    </>
  ),
  elephant: elephantVariant.face,
  koala: koalaVariant.face,
  lion: lionVariant.face,
  monkey: monkeyVariant.face,
}

/* ============================================================
 * Variant-specific wings map
 * ============================================================ */
const variantWings: Record<SonnyVariant, React.ReactNode> = {
  bunny: null,
  strawberry: null,
  cat: (
    <g opacity="0.75">
      <path d="M 26 86 C 14 72 -4 56 -8 40 C -10 48 -4 60 4 68 C -2 62 6 72 12 78 C 16 82 22 86 26 88 Z" fill="#f4aac4" stroke="#de86a8" strokeWidth="0.7" />
      <path d="M 26 90 C 18 92 6 88 0 80 C -2 86 4 92 10 94 C 16 96 22 94 26 92 Z" fill="#ffd6e8" stroke="#de86a8" strokeWidth="0.6" />
      <path d="M 26 86 Q 10 68 -4 48" fill="none" stroke="#de86a8" strokeWidth="0.5" opacity="0.4" />
      <path d="M 26 86 Q 14 78 4 68" fill="none" stroke="#de86a8" strokeWidth="0.4" opacity="0.35" />
      <path d="M 26 90 Q 14 90 4 84" fill="none" stroke="#de86a8" strokeWidth="0.4" opacity="0.3" />
      <circle cx="8" cy="62" r="3" fill="#fff0f5" opacity="0.4" />
      <circle cx="14" cy="74" r="2.5" fill="#fff0f5" opacity="0.35" />
      <circle cx="10" cy="88" r="2" fill="#fff0f5" opacity="0.3" />
      <path d="M 74 86 C 86 72 104 56 108 40 C 110 48 104 60 96 68 C 102 62 94 72 88 78 C 84 82 78 86 74 88 Z" fill="#f4aac4" stroke="#de86a8" strokeWidth="0.7" />
      <path d="M 74 90 C 82 92 94 88 100 80 C 102 86 96 92 90 94 C 84 96 78 94 74 92 Z" fill="#ffd6e8" stroke="#de86a8" strokeWidth="0.6" />
      <path d="M 74 86 Q 90 68 104 48" fill="none" stroke="#de86a8" strokeWidth="0.5" opacity="0.4" />
      <path d="M 74 86 Q 86 78 96 68" fill="none" stroke="#de86a8" strokeWidth="0.4" opacity="0.35" />
      <path d="M 74 90 Q 86 90 96 84" fill="none" stroke="#de86a8" strokeWidth="0.4" opacity="0.3" />
      <circle cx="92" cy="62" r="3" fill="#fff0f5" opacity="0.4" />
      <circle cx="86" cy="74" r="2.5" fill="#fff0f5" opacity="0.35" />
      <circle cx="90" cy="88" r="2" fill="#fff0f5" opacity="0.3" />
    </g>
  ),
  bear: null,
  duck: null,
  flower: (
    <g opacity="0.8">
      <ellipse cx="6" cy="58" rx="10" ry="6" fill="#ffc8dd" stroke="#ff8fab" strokeWidth="0.6" transform="rotate(-50 6 58)" />
      <ellipse cx="2" cy="70" rx="9" ry="5.5" fill="#ffb3d1" stroke="#ff8fab" strokeWidth="0.5" transform="rotate(-30 2 70)" />
      <ellipse cx="6" cy="82" rx="8" ry="5" fill="#ffc8dd" stroke="#ff8fab" strokeWidth="0.5" transform="rotate(-10 6 82)" />
      <circle cx="6" cy="58" r="2.5" fill="#ffdd44" opacity="0.4" />
      <circle cx="2" cy="70" r="2" fill="#ffdd44" opacity="0.35" />
      <circle cx="6" cy="82" r="1.8" fill="#ffdd44" opacity="0.3" />
      <ellipse cx="94" cy="58" rx="10" ry="6" fill="#ffc8dd" stroke="#ff8fab" strokeWidth="0.6" transform="rotate(50 94 58)" />
      <ellipse cx="98" cy="70" rx="9" ry="5.5" fill="#ffb3d1" stroke="#ff8fab" strokeWidth="0.5" transform="rotate(30 98 70)" />
      <ellipse cx="94" cy="82" rx="8" ry="5" fill="#ffc8dd" stroke="#ff8fab" strokeWidth="0.5" transform="rotate(10 94 82)" />
      <circle cx="94" cy="58" r="2.5" fill="#ffdd44" opacity="0.4" />
      <circle cx="98" cy="70" r="2" fill="#ffdd44" opacity="0.35" />
      <circle cx="94" cy="82" r="1.8" fill="#ffdd44" opacity="0.3" />
    </g>
  ),
  elephant: null,
  koala: null,
  lion: lionVariant.wings,
  monkey: monkeyVariant.wings,
}

/* Pink variants keep wings; non-pink get animal-colour mittens */
const pinkVariants = new Set<SonnyVariant>(['cat', 'flower'])

/* ============================================================
 * Eye gaze direction per variant
 * ============================================================ */
const eyeGaze: Record<SonnyVariant, { dx: number; dy: number }> = {
  bunny:      { dx: 2, dy: 0 },
  strawberry: { dx: 1.5, dy: 0 },
  cat:        { dx: 2, dy: 0 },
  bear:       { dx: 1.5, dy: 0 },
  duck:       { dx: 2, dy: 0 },
  flower:     { dx: 1.5, dy: 0 },
  elephant:   { dx: 2, dy: 0 },
  koala:      { dx: 1.5, dy: 0 },
  lion:       { dx: 2, dy: 0 },
  monkey:     { dx: 2, dy: 0 },
}

/* ============================================================
 * Mitten colours for non-bunny variants
 * ============================================================ */
const mittenColors: Partial<Record<SonnyVariant, { fill: string; stroke: string }>> = {
  strawberry: { fill: '#D42B4A', stroke: '#B81D3C' },
  cat:        { fill: '#f4aac4', stroke: '#de86a8' },
  bear:       { fill: '#d4956a', stroke: '#b8794e' },
  duck:       { fill: '#FFD93D', stroke: '#F5C518' },
  flower:     { fill: '#ffc8dd', stroke: '#ff8fab' },
  elephant:   { fill: '#6BA3C4', stroke: '#5A8FAF' },
  koala:      { fill: '#A0A0A0', stroke: '#7A7A7A' },
  lion:       { fill: '#C4923A', stroke: '#A07030' },
  monkey:     { fill: '#4CAF50', stroke: '#388E3C' },
}

/* Subtle lashes */
const subtleLeftLashes = (
  <>
    <path d="M 34 61 Q 32.5 58 31.5 56" fill="none" stroke="#2e1e1e" strokeWidth="0.7" strokeLinecap="round" />
    <path d="M 37 59.5 Q 36.5 56.5 36 54.5" fill="none" stroke="#2e1e1e" strokeWidth="0.6" strokeLinecap="round" />
    <path d="M 40 60.5 Q 41 57.5 42 56" fill="none" stroke="#2e1e1e" strokeWidth="0.5" strokeLinecap="round" />
  </>
)
const subtleRightLashes = (
  <>
    <path d="M 66 61 Q 67.5 58 68.5 56" fill="none" stroke="#2e1e1e" strokeWidth="0.7" strokeLinecap="round" />
    <path d="M 63 59.5 Q 63.5 56.5 64 54.5" fill="none" stroke="#2e1e1e" strokeWidth="0.6" strokeLinecap="round" />
    <path d="M 60 60.5 Q 59 57.5 58 56" fill="none" stroke="#2e1e1e" strokeWidth="0.5" strokeLinecap="round" />
  </>
)

/* ============================================================
 * SonnyAngelDetailed
 * ============================================================ */
const SonnyAngelDetailed = memo(function SonnyAngelDetailed({
  size = 48,
  className = '',
  variant = 'bunny',
  alwaysClosed = false,
}: SonnyAngelProps) {
  const [blink, setBlink] = useState(false)

  useEffect(() => {
    if (alwaysClosed) return
    const doDoubleBlink = () => {
      setBlink(true)
      setTimeout(() => setBlink(false), 150)
      setTimeout(() => setBlink(true), 350)
      setTimeout(() => setBlink(false), 500)
    }
    const interval = setInterval(doDoubleBlink, 3000)
    doDoubleBlink()
    return () => clearInterval(interval)
  }, [alwaysClosed])

  const eyeScaleY = alwaysClosed ? 0.04 : blink ? 0.04 : 1
  const gaze = eyeGaze[variant] || { dx: 0, dy: 0 }

  return (
    <span
      className={`${animClass[variant] || 'sonny-sway'} align-bottom translate-y-1 overflow-visible ${className}`}
    >
      <svg
        width={size}
        height={Math.round(size * 1.5)}
        viewBox="-10 -18 120 155"
        overflow="visible"
        xmlns="http://www.w3.org/2000/svg"
        className="block"
        style={{ filter: 'drop-shadow(0 0 7px rgba(183,110,121,0.6))' }}
      >
        {/* LAYER 1 -- Headgear */}
        {headgear[variant] || headgear.bunny}

        {/* LAYER 2 -- Head */}
        <ellipse cx="50" cy="66" rx="32" ry="34" fill="url(#sonny-skin-base)" stroke="#f0b8a0" strokeWidth="1.2" />

        {/* LAYER 3 -- Head shadow */}
        <ellipse cx="50" cy="66" rx="32" ry="34" fill="url(#sonny-skin-ao)" />

        {/* LAYER 4 -- Head highlight */}
        <ellipse cx="44" cy="58" rx="20" ry="22" fill="url(#sonny-skin-shine)" />

        {/* LAYER 5 -- Forehead cover */}
        {foreheadCover[variant] || foreheadCover.bunny}

        {/* LAYER 5b -- Headgear face */}
        {headgearFace[variant] || null}

        {/* LAYER 6 -- Body */}
        <ellipse cx="50" cy="100" rx="24" ry="20" fill="url(#sonny-skin-base)" stroke="#f0b8a0" strokeWidth="1" />

        {/* LAYER 7 -- Body shadow */}
        <ellipse cx="50" cy="100" rx="24" ry="20" fill="url(#sonny-skin-ao)" />

        {/* LAYER 8 -- Body highlight */}
        <ellipse cx="44" cy="94" rx="16" ry="14" fill="url(#sonny-skin-shine)" />

        {/* LAYER 9 -- Neck shadow */}
        <ellipse cx="50" cy="84" rx="16" ry="4" fill="#D4956A" opacity="0.08" />

        {/* LAYER 10/11 -- Wings */}
        {pinkVariants.has(variant) && (
          <g>
            <path d="M 26 88 C 18 78 6 68 0 58 C -2 64 2 72 8 78 C 4 74 10 80 16 84 C 20 86 24 88 26 90 Z" fill="#fff0f5" stroke="#f0b8a0" strokeWidth="0.6" opacity="0.7" />
            <path d="M 26 88 Q 12 74 2 60" fill="none" stroke="#f0b8a0" strokeWidth="0.4" opacity="0.15" />
            <path d="M 26 88 Q 16 78 8 70" fill="none" stroke="#f0b8a0" strokeWidth="0.3" opacity="0.12" />
            <path d="M 26 90 Q 14 84 6 76" fill="none" stroke="#f0b8a0" strokeWidth="0.3" opacity="0.10" />
            <path d="M 74 88 C 82 78 94 68 100 58 C 102 64 98 72 92 78 C 96 74 90 80 84 84 C 80 86 76 88 74 90 Z" fill="#fff0f5" stroke="#f0b8a0" strokeWidth="0.6" opacity="0.7" />
            <path d="M 74 88 Q 88 74 98 60" fill="none" stroke="#f0b8a0" strokeWidth="0.4" opacity="0.15" />
            <path d="M 74 88 Q 84 78 92 70" fill="none" stroke="#f0b8a0" strokeWidth="0.3" opacity="0.12" />
            <path d="M 74 90 Q 86 84 94 76" fill="none" stroke="#f0b8a0" strokeWidth="0.3" opacity="0.10" />
          </g>
        )}
        {variantWings[variant] || null}

        {/* LAYER 12 -- Rosy cheeks */}
        <ellipse cx="24" cy="74" rx="11" ry="7" fill="#FFB3C8" opacity="0.45" />
        <circle cx="22" cy="72" r="2" fill="white" opacity="0.2" />
        <ellipse cx="76" cy="74" rx="11" ry="7" fill="#FFB3C8" opacity="0.45" />
        <circle cx="74" cy="72" r="2" fill="white" opacity="0.2" />

        {/* LAYER 13 -- Eyes */}
        <g>
          <g style={{ transformOrigin: '38px 66px', transform: `scaleY(${eyeScaleY})`, transition: 'transform 0.08s ease' }}>
            <circle cx="38" cy="66" r="8" fill="white" />
            <circle cx={38 + gaze.dx} cy={66 + gaze.dy} r="6.5" fill="#1a1a1a" />
            <circle cx={36 + gaze.dx} cy={63.5 + gaze.dy} r="2.2" fill="white" />
            <circle cx={40.5 + gaze.dx} cy={67.5 + gaze.dy} r="0.8" fill="white" opacity="0.5" />
            {subtleLeftLashes}
          </g>
          <g style={{ transformOrigin: '62px 66px', transform: `scaleY(${eyeScaleY})`, transition: 'transform 0.08s ease' }}>
            <circle cx="62" cy="66" r="8" fill="white" />
            <circle cx={62 + gaze.dx} cy={66 + gaze.dy} r="6.5" fill="#1a1a1a" />
            <circle cx={60 + gaze.dx} cy={63.5 + gaze.dy} r="2.2" fill="white" />
            <circle cx={64.5 + gaze.dx} cy={67.5 + gaze.dy} r="0.8" fill="white" opacity="0.5" />
            {subtleRightLashes}
          </g>
        </g>

        {/* LAYER 14 -- Nose */}
        <ellipse cx="50" cy="76" rx="2" ry="1.5" fill="#E09090" opacity="0.6" />
        <circle cx="49" cy="75.5" r="0.6" fill="white" opacity="0.3" />

        {/* LAYER 15 -- Smile */}
        <path d="M 45 80 Q 50 84 55 80" fill="none" stroke="#C07070" strokeWidth="1.4" strokeLinecap="round" />

        {/* LAYER 16 -- Arms */}
        {(() => {
          const mc = mittenColors[variant]
          const handFill = mc ? mc.fill : 'url(#sonny-skin-base)'
          const handStroke = mc ? mc.stroke : '#f0b8a0'
          const armFill = mc ? mc.fill : 'url(#sonny-skin-base)'
          const armStroke = mc ? mc.stroke : '#f0b8a0'
          return (
            <>
              <ellipse cx="28" cy="86" rx="5" ry="10" fill={armFill} stroke={armStroke} strokeWidth="0.8" transform="rotate(10 28 86)" />
              <ellipse cx="24" cy="76" rx="5.5" ry="4" fill={handFill} stroke={handStroke} strokeWidth="0.8" />
              <path d="M 20 74 Q 19 72 20 71" fill="none" stroke={handStroke} strokeWidth="0.4" opacity="0.2" />
              <path d="M 23 73 Q 22 71 23 70" fill="none" stroke={handStroke} strokeWidth="0.4" opacity="0.2" />
              <ellipse cx="72" cy="86" rx="5" ry="10" fill={armFill} stroke={armStroke} strokeWidth="0.8" transform="rotate(-10 72 86)" />
              <ellipse cx="76" cy="76" rx="5.5" ry="4" fill={handFill} stroke={handStroke} strokeWidth="0.8" />
              <path d="M 80 74 Q 81 72 80 71" fill="none" stroke={handStroke} strokeWidth="0.4" opacity="0.2" />
              <path d="M 77 73 Q 78 71 77 70" fill="none" stroke={handStroke} strokeWidth="0.4" opacity="0.2" />
            </>
          )
        })()}

        {/* LAYER 17 -- Feet */}
        <ellipse cx="38" cy="122" rx="9" ry="2" fill="#000" opacity="0.04" />
        <ellipse cx="38" cy="118" rx="8" ry="5" fill="url(#sonny-skin-base)" stroke="#f0b8a0" strokeWidth="1" />
        <path d="M 33 116 Q 32 115 33 114" fill="none" stroke="#f0b8a0" strokeWidth="0.4" opacity="0.08" />
        <path d="M 36 115 Q 35 114 36 113" fill="none" stroke="#f0b8a0" strokeWidth="0.4" opacity="0.08" />
        <ellipse cx="62" cy="122" rx="9" ry="2" fill="#000" opacity="0.04" />
        <ellipse cx="62" cy="118" rx="8" ry="5" fill="url(#sonny-skin-base)" stroke="#f0b8a0" strokeWidth="1" />
        <path d="M 67 116 Q 68 115 67 114" fill="none" stroke="#f0b8a0" strokeWidth="0.4" opacity="0.08" />
        <path d="M 64 115 Q 65 114 64 113" fill="none" stroke="#f0b8a0" strokeWidth="0.4" opacity="0.08" />
      </svg>
    </span>
  )
})

export default SonnyAngelDetailed

import { useEffect, useState } from 'react';

interface ConfettiCelebrationProps {
  show: boolean;
}

const PARTICLE_COUNT = 30;
const ANIMATION_DURATION_MS = 2000;

const THEME_COLORS = ['#F06292', '#FFD54F', '#69F0AE', '#FFFFFF'];

/**
 * Generates an array of confetti particle style objects with randomized
 * positions, sizes, colors, shapes, and animation delays.
 */
function generateParticles() {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => {
    const size = 6 + Math.random() * 8;
    const isCircle = Math.random() > 0.5;
    return {
      id: i,
      left: `${5 + Math.random() * 90}%`,
      width: `${size}px`,
      height: `${isCircle ? size : size * 0.6}px`,
      backgroundColor: THEME_COLORS[i % THEME_COLORS.length],
      borderRadius: isCircle ? '50%' : '2px',
      animationDelay: `${Math.random() * 0.4}s`,
      animationDuration: `${1.2 + Math.random() * 1.0}s`,
    };
  });
}

export function ConfettiCelebration({ show }: ConfettiCelebrationProps) {
  const [visible, setVisible] = useState(false);
  const [particles] = useState(generateParticles);

  useEffect(() => {
    if (!show) return;

    setVisible(true);

    const timer = setTimeout(() => {
      setVisible(false);
    }, ANIMATION_DURATION_MS);

    return () => clearTimeout(timer);
  }, [show]);

  if (!visible) return null;

  return (
    <div className="confetti-overlay">
      {/* Confetti particles */}
      <div className="confetti-container">
        {particles.map((p) => (
          <div
            key={p.id}
            className="confetti-particle"
            style={{
              left: p.left,
              width: p.width,
              height: p.height,
              backgroundColor: p.backgroundColor,
              borderRadius: p.borderRadius,
              animationDelay: p.animationDelay,
              animationDuration: p.animationDuration,
            }}
          />
        ))}
      </div>

      {/* NEW PR! text */}
      <div className="confetti-text-wrapper">
        <span className="confetti-pr-text">NEW PR!</span>
      </div>

      <style>{`
        .confetti-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          pointer-events: none;
          overflow: hidden;
        }

        .confetti-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
        }

        .confetti-particle {
          position: absolute;
          top: 40%;
          opacity: 0;
          animation-name: confetti-burst;
          animation-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          animation-fill-mode: forwards;
        }

        @keyframes confetti-burst {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg) scale(0);
            opacity: 1;
          }
          10% {
            transform: translateY(-30vh) translateX(var(--drift, 0px)) rotate(90deg) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(60vh) translateX(var(--drift, 0px)) rotate(720deg) scale(0.5);
            opacity: 0;
          }
        }

        /* Apply random horizontal drift per particle via nth-child */
        .confetti-particle:nth-child(6n+1) { --drift: -8vw; }
        .confetti-particle:nth-child(6n+2) { --drift: 6vw; }
        .confetti-particle:nth-child(6n+3) { --drift: -5vw; }
        .confetti-particle:nth-child(6n+4) { --drift: 9vw; }
        .confetti-particle:nth-child(6n+5) { --drift: -10vw; }
        .confetti-particle:nth-child(6n+6) { --drift: 3vw; }

        .confetti-text-wrapper {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .confetti-pr-text {
          font-size: clamp(1.5rem, 8vw, 3rem);
          font-weight: 900;
          letter-spacing: 0.05em;
          background: linear-gradient(135deg, #F06292, #FFD54F, #69F0AE);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: none;
          animation: pr-text-pop 2s ease-out forwards;
          filter: drop-shadow(0 0 20px rgba(240, 98, 146, 0.6));
        }

        @keyframes pr-text-pop {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          20% {
            transform: scale(1.4);
            opacity: 1;
          }
          40% {
            transform: scale(1.0);
            opacity: 1;
          }
          70% {
            transform: scale(1.0);
            opacity: 1;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}

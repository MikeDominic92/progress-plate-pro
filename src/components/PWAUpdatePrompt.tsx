import { useRegisterSW } from 'virtual:pwa-register/react';

export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm">
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-background/95 border border-primary/30 backdrop-blur-sm shadow-lg">
        <p className="flex-1 text-xs text-white/70">A new version is available.</p>
        <button
          onClick={() => updateServiceWorker(true)}
          className="px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30 text-xs font-semibold text-primary hover:bg-primary/30 transition-colors"
        >
          Update
        </button>
      </div>
    </div>
  );
}

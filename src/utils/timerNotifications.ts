/**
 * Utility functions for rest timer completion alerts.
 *
 * * playBeep()          - plays a short audio chime via the Web Audio API
 * * notifyRestComplete() - shows a browser Notification (requests permission if needed)
 * * requestNotificationPermission() - explicitly requests Notification permission
 */

/**
 * Play a short 880 Hz beep for 0.3 seconds using the Web Audio API.
 * Also triggers a vibration pattern via the Vibration API as a fallback
 * for users on silent mode. No external audio file is required.
 */
export function playBeep(): void {
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 880;
    gain.gain.value = 0.3;

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Silently ignore -- audio may be blocked by the browser.
  }

  // Vibration API fallback for users on silent mode
  if (navigator.vibrate) {
    navigator.vibrate([200, 100, 200]);
  }
}

/**
 * Show a browser Notification indicating the rest period is over.
 * If permission has not yet been requested, this will trigger the
 * permission prompt (except when the user has already denied it).
 */
export function notifyRestComplete(): void {
  try {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification('Rest Complete', { body: 'Time for your next set!' });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  } catch {
    // Silently ignore -- Notifications may not be supported.
  }
}

/**
 * Request Notification permission proactively (e.g. when the user first
 * starts a rest timer) so the completion notification can fire later.
 */
export function requestNotificationPermission(): void {
  try {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  } catch {
    // Silently ignore.
  }
}

/**
 * Web Audio API synthesizer for urgent alert chimes.
 * Plays high-tech radar alert chimes through the laptop speakers without external audio files.
 */
export function playUrgentAlertChime() {
    try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;

        const ctx = new AudioCtx();

        // High priority dual-tone frequency sequence (880Hz -> 1174Hz)
        const now = ctx.currentTime;

        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(880, now);
        osc1.frequency.exponentialRampToValueAtTime(1174, now + 0.12);

        gain1.gain.setValueAtTime(0.3, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

        osc1.connect(gain1);
        gain1.connect(ctx.destination);

        osc1.start(now);
        osc1.stop(now + 0.25);

        // Echo chirp
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1174, now + 0.15);
        osc2.frequency.exponentialRampToValueAtTime(1480, now + 0.35);

        gain2.gain.setValueAtTime(0.35, now + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc2.start(now + 0.15);
        osc2.stop(now + 0.45);
    } catch (err) {
        console.warn('AudioContext playback error (awaiting user gesture):', err);
    }
}

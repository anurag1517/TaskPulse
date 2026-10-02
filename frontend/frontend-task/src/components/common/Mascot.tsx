import './Mascot.css';

export type MascotMood = 'idle' | 'typing' | 'peek' | 'p1_angry' | 'p2_stressed' | 'celebrate';

interface MascotProps {
    mood: MascotMood;
    size?: number;
    className?: string;
}

export function Mascot({ mood = 'idle', size = 72, className = '' }: MascotProps) {
    const getMoodDetails = () => {
        switch (mood) {
            case 'p1_angry':
                return {
                    emoji: '👹',
                    label: 'DEFCON 1: RAGING',
                    subtext: 'Critical P1 task requires your immediate attention!',
                    badgeColor: 'var(--p1-base)',
                    animClass: 'mascot-raging',
                };
            case 'p2_stressed':
                return {
                    emoji: '😰',
                    label: 'PRESSURE MOUNTING',
                    subtext: 'High priority tasks are ticking down.',
                    badgeColor: 'var(--p2-base)',
                    animClass: 'mascot-stressed',
                };
            case 'peek':
                return {
                    emoji: '🙈',
                    label: 'TOP SECRET',
                    subtext: 'Shielding eyes while password is typed.',
                    badgeColor: 'var(--primary)',
                    animClass: 'mascot-peek',
                };
            case 'typing':
                return {
                    emoji: '🧐',
                    label: 'LISTENING CLOSELY',
                    subtext: 'Validating credentials...',
                    badgeColor: 'var(--p3-base)',
                    animClass: 'mascot-typing',
                };
            case 'celebrate':
                return {
                    emoji: '😎',
                    label: 'SYSTEM ZEN',
                    subtext: 'All clear! Maximum productivity unlocked.',
                    badgeColor: 'var(--p4-base)',
                    animClass: 'mascot-celebrate',
                };
            case 'idle':
            default:
                return {
                    emoji: '🤖',
                    label: 'TASKPULSE AI',
                    subtext: 'Ready for action.',
                    badgeColor: 'var(--text-secondary)',
                    animClass: 'mascot-idle',
                };
        }
    };

    const details = getMoodDetails();

    return (
        <div className={`mascot-container ${details.animClass} ${className}`}>
            <div
                className="mascot-face"
                style={{
                    width: size,
                    height: size,
                    fontSize: `${size * 0.6}px`,
                }}
            >
                {details.emoji}
                {mood === 'p1_angry' && <span className="fire-aura">🔥</span>}
            </div>
        </div>
    );
}

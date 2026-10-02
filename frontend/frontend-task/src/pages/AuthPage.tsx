import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mascot } from '../components/common/Mascot';
import type { MascotMood } from '../components/common/Mascot';
import { Input } from '../components/common/Input';
import { Button } from '../components/common/Button';
import './AuthPage.css';

export function AuthPage() {
    const { login, signup } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [mascotMood, setMascotMood] = useState<MascotMood>('idle');

    // Password criteria for signup
    const hasMinLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const isPasswordValid = hasMinLength && hasUppercase && hasNumber && hasSpecial;
    const passwordsMatch = password.length > 0 && password === confirmPassword;

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccessMessage(null);

        if (!isLogin) {
            if (!isPasswordValid) {
                setError('Please satisfy all password security requirements.');
                setMascotMood('p1_angry');
                return;
            }
            if (password !== confirmPassword) {
                setError('Passwords do not match. Please verify your password confirmation.');
                setMascotMood('p1_angry');
                return;
            }
        }

        setLoading(true);
        try {
            if (isLogin) {
                await login({ email, password });
                setMascotMood('celebrate');
            } else {
                const msg = await signup({ email, password });
                setSuccessMessage(msg || 'Account created successfully! You can now log in.');
                setIsLogin(true);
                setPassword('');
                setConfirmPassword('');
                setMascotMood('celebrate');
            }
        } catch (err: any) {
            setError(err.message || 'Authentication failed. Please check your credentials.');
            setMascotMood('p1_angry');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-container">
            {/* Ambient Aurora Glow */}
            <div className="app-background">
                <div className="aurora-mesh aurora-1" />
                <div className="aurora-mesh aurora-2" />
                <div className="aurora-mesh aurora-3" />
            </div>

            <div className="auth-content-grid">
                {/* Left Side: Showcase & Live Teasers */}
                <section className="auth-showcase-panel">
                    <div className="showcase-brand">
                        <span className="brand-flame">🔥</span>
                        <h1 className="showcase-title">TaskPulse</h1>
                    </div>

                    <h2 className="showcase-headline">
                        Never Forget <br />
                        <span className="gradient-text">What Needs Doing Today.</span>
                    </h2>

                    {/* Floating Feature Teaser Cards */}
                    <div className="showcase-cards-stack">
                        <div className="preview-card preview-p1">
                            <div className="preview-header">
                                <span className="preview-emoji">👹</span>
                                <span className="preview-tag">P1 MUST DO TODAY</span>
                                <span className="preview-alert">🔥 Hourly Alert ON</span>
                            </div>
                            <h4 className="preview-topic">Pay house rent & electricity bill before 11 PM</h4>
                            <p className="preview-meta">📍 Online Banking • 👤 Landlord • Avoid late fee</p>
                        </div>

                        <div className="preview-card preview-p2">
                            <div className="preview-header">
                                <span className="preview-emoji">⚡</span>
                                <span className="preview-tag">P2 HIGH PRIORITY</span>
                                <span className="preview-time">Due in 2h</span>
                            </div>
                            <h4 className="preview-topic">Pick up Mom's medicine & groceries</h4>
                            <p className="preview-meta">📍 Downtown Pharmacy • 👤 Family</p>
                        </div>
                    </div>
                </section>

                {/* Right Side: Auth Card with Interactive Mascot */}
                <section className="auth-form-panel">
                    <div className="auth-glass-card">
                        {/* Interactive Mascot */}
                        <div className="auth-mascot-wrapper">
                            <Mascot mood={mascotMood} size={84} />
                            <div className="mascot-mood-pill">
                                {mascotMood === 'peek' && '🙈 Shielding eyes!'}
                                {mascotMood === 'typing' && '🧐 Listening closely...'}
                                {mascotMood === 'p1_angry' && '😤 Something is wrong!'}
                                {mascotMood === 'celebrate' && '🎉 Welcome aboard!'}
                                {mascotMood === 'idle' && '🤖 Ready when you are'}
                            </div>
                        </div>

                        {/* Mode Switcher Tabs */}
                        <div className="auth-mode-tabs">
                            <button
                                type="button"
                                className={`auth-tab-btn ${isLogin ? 'active-tab' : ''}`}
                                onClick={() => {
                                    setIsLogin(true);
                                    setError(null);
                                    setSuccessMessage(null);
                                    setConfirmPassword('');
                                    setMascotMood('idle');
                                }}
                            >
                                Sign In
                            </button>
                            <button
                                type="button"
                                className={`auth-tab-btn ${!isLogin ? 'active-tab' : ''}`}
                                onClick={() => {
                                    setIsLogin(false);
                                    setError(null);
                                    setSuccessMessage(null);
                                    setConfirmPassword('');
                                    setMascotMood('idle');
                                }}
                            >
                                Create Account
                            </button>
                        </div>

                        {error && <div className="auth-alert-box alert-error">{error}</div>}
                        {successMessage && <div className="auth-alert-box alert-success">{successMessage}</div>}

                        <form onSubmit={handleSubmit} className="auth-form">
                            <Input
                                label="Email Address"
                                type="email"
                                placeholder="you@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onFocus={() => setMascotMood('typing')}
                                onBlur={() => setMascotMood('idle')}
                                required
                            />

                            <Input
                                label="Password"
                                type="password"
                                placeholder="••••••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setMascotMood('peek')}
                                onBlur={() => setMascotMood('idle')}
                                required
                            />

                            {/* Confirm Password (only during signup) */}
                            {!isLogin && (
                                <Input
                                    label="Confirm Password"
                                    type="password"
                                    placeholder="••••••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    onFocus={() => setMascotMood('peek')}
                                    onBlur={() => setMascotMood('idle')}
                                    error={confirmPassword && !passwordsMatch ? 'Passwords do not match' : undefined}
                                    required
                                />
                            )}

                            {/* Live Password Strength Meter for Signup */}
                            {!isLogin && (
                                <div className="password-criteria-panel">
                                    <span className="criteria-heading">Security Requirements:</span>
                                    <div className="criteria-grid">
                                        <span className={`criteria-chip ${hasMinLength ? 'chip-valid' : ''}`}>
                                            {hasMinLength ? '✓' : '○'} 8+ Characters
                                        </span>
                                        <span className={`criteria-chip ${hasUppercase ? 'chip-valid' : ''}`}>
                                            {hasUppercase ? '✓' : '○'} 1 Uppercase (A-Z)
                                        </span>
                                        <span className={`criteria-chip ${hasNumber ? 'chip-valid' : ''}`}>
                                            {hasNumber ? '✓' : '○'} 1 Number (0-9)
                                        </span>
                                        <span className={`criteria-chip ${hasSpecial ? 'chip-valid' : ''}`}>
                                            {hasSpecial ? '✓' : '○'} 1 Special (!@#$)
                                        </span>
                                        <span className={`criteria-chip ${passwordsMatch ? 'chip-valid' : ''}`}>
                                            {passwordsMatch ? '✓' : '○'} Passwords Match
                                        </span>
                                    </div>
                                </div>
                            )}

                            <Button
                                variant="primary"
                                size="lg"
                                type="submit"
                                loading={loading}
                                className="auth-submit-btn"
                            >
                                {isLogin ? 'Sign In to TaskPulse' : 'Create Your Account'}
                            </Button>
                        </form>
                    </div>
                </section>
            </div>
        </div>
    );
}

import { useState, useEffect, useRef } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { inputClass } from '../../../utils/styles';

type Props = { isOpen: boolean; onClose: () => void; onLogin: (email: string, password: string) => Promise<void> };

export function LoginModal({ isOpen, onClose, onLogin }: Props) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const passwordRef = useRef<HTMLInputElement>(null);

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            setError('Please enter email and password');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await onLogin(email.trim(), password);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === 'Enter' && !loading) {
                e.preventDefault();
                handleLogin();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, loading, email, password]);

    const handleEmailKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            passwordRef.current?.focus();
        }
    };

    const handlePasswordKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !loading) {
            e.preventDefault();
            handleLogin();
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Login" persistent>
            <div className="space-y-4">
                <p className="text-sm text-stone-600">Login with your email and password.</p>

                <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                        Email
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={handleEmailKeyDown}
                        placeholder="you@company.com"
                        className={inputClass}
                        autoFocus
                    />
                </div>

                <div>
                    <label className="block text-xs font-medium text-stone-500 mb-1.5 uppercase tracking-wider">
                        Password
                    </label>
                    <input
                        ref={passwordRef}
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        onKeyDown={handlePasswordKeyDown}
                        placeholder="••••••••"
                        className={inputClass}
                    />
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <Button variant="primary" size="lg" fullWidth onClick={handleLogin} disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </Button>
            </div>
        </Modal>
    );
}

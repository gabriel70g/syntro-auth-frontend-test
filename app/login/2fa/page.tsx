'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { mfaService } from '@/lib/services/mfa.service';

/**
 * Página de Desafío 2FA - Login
 * Solicita código de 6 dígitos para completar el login.
 */
export default function TwoFaChallengePage() {
    const router = useRouter();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [tempToken, setTempToken] = useState<string | null>(null);

    useEffect(() => {
        // Recuperar token temporal
        if (typeof window !== 'undefined') {
            const token = sessionStorage.getItem('mfa_temp_token');
            if (!token) {
                router.replace('/login');
                return;
            }
            setTempToken(token);
        }
        // Focus en primer input
        if (inputRefs.current[0]) {
            inputRefs.current[0].focus();
        }
    }, [router]);

    const handleInputChange = (index: number, value: string) => {
        if (!/^\d*$/.test(value)) return;

        const newCode = [...code];
        newCode[index] = value;
        setCode(newCode);

        // Auto-advance
        if (value && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }

        // Auto-submit si completó
        if (value && index === 5 && newCode.every(c => c)) {
            verifyCode(newCode.join(''), tempToken);
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        // Backspace: borrar y retroceder
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        // Left arrow
        if (e.key === 'ArrowLeft' && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
        // Right arrow
        if (e.key === 'ArrowRight' && index < 5) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const verifyCode = async (fullCode: string, token: string | null) => {
        if (!token) return;
        setIsLoading(true);
        setError('');

        try {
            const result = await mfaService.verifyLogin(token, fullCode);
            if (result.success) {
                // Limpiar storage
                sessionStorage.removeItem('mfa_temp_token');
                // Redirigir
                window.location.href = '/dashboard';
            } else {
                setError(result.error || 'Código inválido');
                setIsLoading(false);
            }
        } catch (err) {
            setError('Error de conexión');
            setIsLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        verifyCode(code.join(''), tempToken);
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#f1f5f9'
        }}>
            <div style={{
                maxWidth: '400px',
                width: '100%',
                background: 'rgba(30, 41, 59, 0.8)',
                border: '1px solid rgba(148, 163, 184, 0.2)',
                borderRadius: '16px',
                padding: '2rem',
                textAlign: 'center'
            }}>
                <div style={{
                    width: '64px', height: '64px',
                    borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem auto'
                }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                </div>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                    Verificación Segura
                </h2>
                <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '0.9rem' }}>
                    Ingresa el código de 6 dígitos de tu aplicación autenticadora.
                </p>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5',
                        padding: '0.75rem', borderRadius: '8px', fontSize: '0.875rem',
                        marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginBottom: '2rem' }}>
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={el => { inputRefs.current[index] = el; }}
                                type="text"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleInputChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                disabled={isLoading}
                                style={{
                                    width: '3rem', height: '3.5rem', fontSize: '1.5rem', textAlign: 'center',
                                    background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(148, 163, 184, 0.2)',
                                    borderRadius: '8px', color: 'white', outline: 'none',
                                    transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#60a5fa'}
                                onBlur={(e) => e.target.style.borderColor = 'rgba(148, 163, 184, 0.2)'}
                            />
                        ))}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || code.join('').length < 6}
                        style={{
                            width: '100%', padding: '0.875rem',
                            background: isLoading ? '#475569' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                            color: 'white', border: 'none', borderRadius: '8px',
                            fontWeight: '600', cursor: isLoading ? 'not-allowed' : 'pointer',
                            transition: 'opacity 0.2s'
                        }}
                    >
                        {isLoading ? 'Verificando...' : 'Verificar'}
                    </button>
                </form>
            </div>
        </div>
    );
}

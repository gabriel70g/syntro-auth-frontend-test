'use client';

import { useEffect, useState } from 'react';
import { decodeJwtPayload, formatExpiry } from '@/lib/utils/jwt';

const SECURITY_FEATURES = [
    { name: 'Cifrado RSA-OAEP', desc: 'Contraseña cifrada con clave pública antes de enviar' },
    { name: 'Anti-replay', desc: 'Seed único por intento, consumido una sola vez' },
    { name: 'Argon2id', desc: 'Hashing de contraseñas con 64MB memoria, resistente a GPU' },
    { name: 'Rate limiting', desc: '5 intentos / 15 min por IP en login' },
    { name: 'Refresh Token Rotation', desc: 'Rotación de tokens + detección de robo' },
    { name: 'JWT firmado', desc: 'RS256/HS256, validación de firma en cada request' },
    { name: 'Multi-tenant', desc: 'Aislamiento por tenant' },
    { name: 'Auditoría', desc: 'Eventos sensibles registrados' },
];

export default function DashboardPage() {
    const [claims, setClaims] = useState<ReturnType<typeof decodeJwtPayload>>(null);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const token = localStorage.getItem('auth_token');
        if (!token) {
            window.location.href = '/login';
            return;
        }
        setClaims(decodeJwtPayload(token));
    }, []);

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
            color: '#f1f5f9',
            padding: '2rem',
        }}>
            <div style={{ textAlign: 'center', maxWidth: '680px', width: '100%' }}>
                <h1 style={{
                    fontSize: '3rem',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, #ffffff 0%, #d4af37 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '0.5rem',
                }}>
                    ✓ Login Exitoso
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '1.125rem', marginBottom: '2rem' }}>
                    Has iniciado sesión correctamente
                </p>

                {/* Nota de seguridad con atributos del login */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.8)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '16px',
                    padding: '1.5rem 1.75rem',
                    marginBottom: '2rem',
                    textAlign: 'left',
                }}>
                    <h2 style={{
                        fontSize: '1.25rem',
                        fontWeight: '600',
                        color: '#f4d03f',
                        marginBottom: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                    }}>
                        <span>🛡️</span> Seguridad grado bancario
                    </h2>
                    <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                        Este login utilizó los siguientes controles de seguridad. Tus credenciales nunca viajaron en texto plano.
                    </p>

                    {claims && (
                        <div style={{ marginBottom: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.75rem' }}>
                                Atributos del token (claims JWT)
                            </h3>
                            <div style={{
                                background: 'rgba(15, 23, 42, 0.6)',
                                borderRadius: '10px',
                                padding: '1rem',
                                fontFamily: 'monospace',
                                fontSize: '0.8rem',
                            }}>
                                <div style={{ display: 'grid', gap: '0.35rem' }}>
                                    <Row label="sub (userId)" value={claims.sub} />
                                    <Row label="email" value={claims.email} />
                                    <Row label="tenant_id" value={claims.tenant_id} />
                                    <Row label="exp (expira)" value={formatExpiry(claims.exp)} />
                                    <Row label="iss (emisor)" value={claims.iss} />
                                    <Row label="aud (audiencia)" value={claims.aud} />
                                </div>
                            </div>
                        </div>
                    )}

                    <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.75rem' }}>
                        Controles aplicados
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {SECURITY_FEATURES.map((f) => (
                            <li key={f.name} style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '0.5rem',
                                marginBottom: '0.5rem',
                                fontSize: '0.85rem',
                            }}>
                                <span style={{ color: '#22c55e' }}>✓</span>
                                <span>
                                    <strong style={{ color: '#e2e8f0' }}>{f.name}</strong>
                                    <span style={{ color: '#94a3b8', marginLeft: '0.25rem' }}>— {f.desc}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <button
                    onClick={() => {
                        localStorage.clear();
                        window.location.href = '/login';
                    }}
                    style={{
                        padding: '0.875rem 2rem',
                        background: 'linear-gradient(135deg, #d4af37 0%, #f4d03f 100%)',
                        color: '#0f172a',
                        fontWeight: '600',
                        border: 'none',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        fontSize: '1rem',
                    }}
                >
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );
}

function Row({ label, value }: { label: string; value?: string }) {
    if (value == null) return null;
    return (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ color: '#64748b', minWidth: '120px' }}>{label}:</span>
            <span style={{ color: '#e2e8f0', wordBreak: 'break-all' }}>{value}</span>
        </div>
    );
}

'use client';

import { SyntropySoftLogoCompact } from '@common/components/AuthFlowBrandMark';
import { clearAuthSessionStorage } from '@common/lib/storage/auth-session.storage';
import { postAuthLogout } from '@common/api/clients/auth.http.client';
import { SECURITY_FEATURES } from '@flows/dashboard/general/data/security-features.data';
import { useDashboardSession } from '@flows/dashboard/general/hooks/useDashboardSession';
import { DashboardClaimRow } from '@flows/dashboard/general/components/DashboardClaimRow';

/**
 * Why: Panel post-login; datos de seguridad y claims desde hook.
 */
export function DashboardScreen() {
    const { claims, formatExpiry } = useDashboardSession();

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                color: '#f1f5f9',
                padding: '2rem',
            }}
        >
            <div style={{ textAlign: 'center', maxWidth: '680px', width: '100%' }}>
                <SyntropySoftLogoCompact />
                <h1
                    style={{
                        fontSize: '3rem',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #ffffff 0%, #d4af37 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '0.5rem',
                    }}
                >
                    ✓ Login Exitoso
                </h1>
                <p style={{ color: '#94a3b8', fontSize: '1.125rem', marginBottom: '1.5rem' }}>
                    Has iniciado sesión correctamente
                </p>

                <div
                    style={{
                        background: 'rgba(59, 130, 246, 0.15)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        borderRadius: '12px',
                        padding: '1rem 1.25rem',
                        marginBottom: '1.5rem',
                        textAlign: 'left',
                    }}
                >
                    <p style={{ color: '#93c5fd', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                        <strong>Demo:</strong> Este frontend es un ejemplo de integración con SyntroAuth.
                        La contraseña acepta cualquier valor no vacío <em>a propósito</em> y el access token
                        se persiste en <code style={{ fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.2)', padding: '1px 4px', borderRadius: '4px' }}>sessionStorage</code> para
                        simplificar la demo (en producción sería solo en memoria con refresh automático).
                    </p>
                </div>

                <div
                    style={{
                        background: 'rgba(30, 41, 59, 0.8)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '16px',
                        padding: '1.5rem 1.75rem',
                        marginBottom: '2rem',
                        textAlign: 'left',
                    }}
                >
                    <h2
                        style={{
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: '#f4d03f',
                            marginBottom: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                        }}
                    >
                        <span>🛡️</span> Seguridad grado bancario
                    </h2>
                    <p style={{ color: '#cbd5e1', fontSize: '0.9rem', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                        Este login utilizó los siguientes controles de seguridad.
                    </p>

                    {claims && (
                        <div style={{ marginBottom: '1.25rem' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.75rem' }}>
                                Atributos del token (claims JWT)
                            </h3>
                            <div
                                style={{
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    borderRadius: '10px',
                                    padding: '1rem',
                                    fontFamily: 'monospace',
                                    fontSize: '0.8rem',
                                }}
                            >
                                <div style={{ display: 'grid', gap: '0.35rem' }}>
                                    <DashboardClaimRow label="sub (userId)" value={claims.sub} />
                                    <DashboardClaimRow label="email" value={claims.email} />
                                    <DashboardClaimRow label="tenant_id" value={claims.tenant_id} />
                                    <DashboardClaimRow
                                        label="exp (expira)"
                                        value={claims.exp !== undefined ? formatExpiry(claims.exp) : undefined}
                                    />
                                    <DashboardClaimRow label="iss (emisor)" value={claims.iss} />
                                    <DashboardClaimRow label="aud (audiencia)" value={claims.aud} />
                                </div>
                            </div>
                        </div>
                    )}

                    <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#94a3b8', marginBottom: '0.75rem' }}>
                        Controles aplicados
                    </h3>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {SECURITY_FEATURES.map((f) => (
                            <li
                                key={f.name}
                                style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: '0.5rem',
                                    marginBottom: '0.5rem',
                                    fontSize: '0.85rem',
                                }}
                            >
                                <span style={{ color: '#22c55e' }}>✓</span>
                                <span>
                                    <strong style={{ color: '#e2e8f0' }}>{f.name}</strong>
                                    <span style={{ color: '#94a3b8', marginLeft: '0.25rem' }}>— {f.desc}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>

                <div style={{ marginBottom: '1.25rem', width: '100%' }}>
                    <a
                        href="/settings/security/mfa"
                        style={{
                            display: 'block',
                            textAlign: 'center',
                            padding: '0.75rem 1rem',
                            borderRadius: '12px',
                            border: '1px solid rgba(148, 163, 184, 0.35)',
                            color: '#93c5fd',
                            textDecoration: 'none',
                            fontSize: '0.95rem',
                            fontWeight: 600,
                        }}
                    >
                        Seguridad: configurar 2FA (TOTP)
                    </a>
                    <p style={{ color: '#64748b', fontSize: '0.75rem', textAlign: 'center', marginTop: '0.5rem' }}>
                        Flujo de cuenta (sesión completa), distinto del 2FA obligatorio al iniciar sesión.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={async () => {
                        await postAuthLogout().catch(() => {});
                        clearAuthSessionStorage();
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

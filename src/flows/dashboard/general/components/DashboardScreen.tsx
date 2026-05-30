'use client';

import { SyntropySoftLogoCompact } from '@common/components/AuthFlowBrandMark';
import { PageShell } from '@common/components/PageShell';
import { GlassCard } from '@common/components/GlassCard';
import { Banner } from '@common/components/Banner';
import { clearAuthSessionStorage } from '@common/lib/storage/auth-session.storage';
import { postAuthLogout } from '@common/api/clients/auth.http.client';
import { formatRelative } from '@common/lib/jwt';
import {
    SECURITY_FEATURES,
    TAG_STYLES,
} from '@flows/dashboard/general/data/security-features.data';
import { useDashboardSession } from '@flows/dashboard/general/hooks/useDashboardSession';
import { DashboardClaimRow } from '@flows/dashboard/general/components/DashboardClaimRow';

/**
 * Why: Panel post-login. Refleja en UI todos los claims del JWT emitido por el
 * backend grado bancario (sid/jti/acr/amr/auth_time/step_up_exp/pv) y la lista
 * de controles aplicados, taggeados por PEN para identidad visual.
 */
export function DashboardScreen() {
    const { claims, formatExpiry } = useDashboardSession();

    const handleLogout = async () => {
        await postAuthLogout().catch(() => { });
        clearAuthSessionStorage();
        window.location.href = '/login';
    };

    return (
        <PageShell variant="stack" className="!p-8">
            <div className="text-center w-full max-w-3xl mx-auto">
                <SyntropySoftLogoCompact />

                <h1 className="text-5xl font-bold heading-gradient mb-2">✓ Login Exitoso</h1>
                <p className="text-[var(--color-text-muted)] text-lg mb-6">
                    Has iniciado sesión correctamente
                </p>

                <Banner variant="info" className="mb-6 text-left">
                    <p className="m-0">
                        <strong>Demo:</strong> Este frontend es un ejemplo de integración con SyntroAuth.
                        La contraseña acepta cualquier valor no vacío <em>a propósito</em> y el access token
                        se persiste en <code className="text-xs bg-[var(--color-info-bg)] px-1 py-px rounded">sessionStorage</code> para
                        simplificar la demo (en producción sería solo en memoria con refresh automático).
                    </p>
                </Banner>

                <GlassCard variant="static" maxWidth="100%" className="mb-8">
                    <div className="text-left">
                        <h2 className="text-xl font-semibold text-[var(--color-gold-soft)] mb-4 flex items-center gap-2">
                            <span>🛡️</span> Seguridad grado bancario + SSO de suite
                        </h2>
                        <p className="text-[var(--color-text-medium)] text-sm mb-4 leading-relaxed">
                            Este login utilizó los siguientes controles de seguridad. Tus credenciales nunca viajaron en texto plano.
                        </p>
                        <p className="text-[var(--color-text-muted)] text-xs mb-5 leading-relaxed italic">
                            Cada capa asume su responsabilidad (SRP): la validación se realiza en cliente antes de enviar, evitando consumir recursos de backend en lo que el frontend puede resolver de forma eficiente. El backend cumple los lineamientos BCRA Com. &quot;A&quot; 7724/7783, NIST 800-63B AAL2 y OWASP ASVS L2.
                        </p>

                        {claims && (
                            <div className="mb-5">
                                <h3 className="text-sm font-semibold text-[var(--color-text-muted)] mb-3">
                                    Atributos del token (claims JWT)
                                </h3>
                                <div className="bg-[var(--color-surface-inner)] rounded-xl p-4 font-mono text-xs">
                                    <div className="grid gap-1.5">
                                        <DashboardClaimRow label="sub (userId)" value={claims.sub} />
                                        <DashboardClaimRow label="email" value={claims.email} />
                                        <DashboardClaimRow label="tenant_id" value={claims.tenant_id} />
                                        <DashboardClaimRow label="jti (id token)" value={claims.jti} hint="PEN-3 — denylist granular" />
                                        <DashboardClaimRow label="sid (sesión)" value={claims.sid} hint="PEN-2 — binding IP/UA" />
                                        <DashboardClaimRow
                                            label="acr (assurance)"
                                            value={claims.acr}
                                            hint={claims.acr === 'high' ? 'PEN-1 — step-up vigente' : 'PEN-1 — login estándar'}
                                        />
                                        <DashboardClaimRow
                                            label="amr (factores)"
                                            value={claims.amr?.join(', ')}
                                            hint="PEN-1 — métodos de autenticación"
                                        />
                                        <DashboardClaimRow
                                            label="auth_time"
                                            value={typeof claims.auth_time === 'number'
                                                ? `${formatExpiry(claims.auth_time)} (${formatRelative(claims.auth_time)})`
                                                : undefined}
                                            hint="PEN-1 — momento del login"
                                        />
                                        <DashboardClaimRow
                                            label="step_up_exp"
                                            value={typeof claims.step_up_exp === 'number'
                                                ? `${formatExpiry(claims.step_up_exp)} (${formatRelative(claims.step_up_exp)})`
                                                : undefined}
                                            hint="PEN-1 — TTL de acr=high"
                                        />
                                        <DashboardClaimRow
                                            label="pv (perm. version)"
                                            value={typeof claims.pv === 'number' ? String(claims.pv) : undefined}
                                            hint="PEN-5 — opt-in vía X-App-Id"
                                        />
                                        <DashboardClaimRow
                                            label="exp (expira)"
                                            value={claims.exp !== undefined
                                                ? `${formatExpiry(claims.exp)} (${formatRelative(claims.exp)})`
                                                : undefined}
                                        />
                                        <DashboardClaimRow label="iss (emisor)" value={claims.iss} />
                                        <DashboardClaimRow label="aud (audiencia)" value={claims.aud} />
                                    </div>
                                </div>
                                <p className="text-[var(--color-text-dim)] text-[0.7rem] mt-2 italic">
                                    Los claims opcionales se omiten cuando no están presentes en el token (p. ej. <code>pv</code> sin <code>X-App-Id</code>, <code>step_up_exp</code> sin step-up reciente).
                                </p>
                            </div>
                        )}

                        <h3 className="text-sm font-semibold text-[var(--color-text-muted)] mb-3">
                            Controles aplicados ({SECURITY_FEATURES.length})
                        </h3>
                        <ul className="list-none p-0 m-0 space-y-2">
                            {SECURITY_FEATURES.map((f) => (
                                <li key={f.name} className="flex items-start gap-2 text-sm">
                                    <span className="text-[var(--color-success-fg)] mt-0.5">✓</span>
                                    <span className="flex-1">
                                        <span className="inline-flex items-center gap-1.5 flex-wrap">
                                            <strong className="text-[var(--color-text-strong)]">{f.name}</strong>
                                            <span className={`${TAG_STYLES[f.tag]} text-[0.65rem] font-bold px-1.5 py-0.5 rounded font-mono tracking-wide`}>
                                                {f.tag}
                                            </span>
                                        </span>
                                        <span className="text-[var(--color-text-muted)] ml-1"> — {f.desc}</span>
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </GlassCard>

                <div className="mb-5 w-full">
                    <a
                        href="/settings/security/mfa"
                        className="block text-center px-4 py-3 rounded-xl border border-[var(--color-border-soft)] text-[var(--color-info-fg)] no-underline text-base font-semibold hover:border-[var(--color-info-accent)] hover:bg-[var(--color-surface-input)] transition-colors"
                    >
                        Seguridad: configurar 2FA (TOTP)
                    </a>
                    <p className="text-[var(--color-text-dim)] text-xs text-center mt-2">
                        Flujo de cuenta (sesión completa), distinto del 2FA obligatorio al iniciar sesión.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={handleLogout}
                    className="btn-gold inline-flex"
                    style={{ width: 'auto', padding: '0.875rem 2rem' }}
                >
                    Cerrar Sesión
                </button>
            </div>
        </PageShell>
    );
}

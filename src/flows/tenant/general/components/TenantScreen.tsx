'use client';

import { SyntropySoftLogoCompact } from '@common/components/AuthFlowBrandMark';
import { PageShell } from '@common/components/PageShell';
import { GlassCard } from '@common/components/GlassCard';
import { Banner } from '@common/components/Banner';
import { FormField } from '@common/components/FormField';
import { Spinner } from '@common/components/Spinner';
import { formatApiError } from '@common/api/mappers/api-error.mapper';
import { useTenantController } from '@flows/tenant/general/hooks/useTenantController';

/**
 * Why: Empresa del usuario. Sin tenant: formulario de alta. Con tenant: datos y descarga del kit.
 * Los errores del backend se muestran con su código.
 */
export function TenantScreen() {
    const c = useTenantController();

    return (
        <PageShell variant="stack" className="!p-8">
            <div className="w-full max-w-2xl mx-auto">
                <div className="text-center">
                    <SyntropySoftLogoCompact />
                </div>

                {c.actionError && (
                    <Banner variant="error" className="mb-6">
                        <p className="m-0 font-mono text-sm">{formatApiError(c.actionError)}</p>
                    </Banner>
                )}

                {c.state.kind === 'loading' && (
                    <div className="flex justify-center py-12">
                        <Spinner />
                    </div>
                )}

                {c.state.kind === 'error' && (
                    <GlassCard variant="static" maxWidth="100%">
                        <Banner variant="error" className="mb-4">
                            <p className="m-0 font-mono text-sm">{formatApiError(c.state.error)}</p>
                        </Banner>
                        <button type="button" className="btn-gold" onClick={() => void c.reload()}>
                            Reintentar
                        </button>
                    </GlassCard>
                )}

                {c.state.kind === 'none' && (
                    <GlassCard variant="static" maxWidth="100%">
                        <h1 className="text-2xl font-bold heading-gradient mb-6">Crear empresa</h1>
                        <form onSubmit={c.createTenant} className="flex flex-col gap-5">
                            <FormField
                                id="companyName"
                                label="Nombre de la empresa"
                                value={c.companyName}
                                onChange={(e) => c.setCompanyName(e.target.value)}
                                disabled={c.busy}
                                autoComplete="organization"
                            />
                            <button type="submit" className="btn-gold" disabled={c.busy}>
                                {c.busy ? 'Creando...' : 'Crear empresa'}
                            </button>
                        </form>
                    </GlassCard>
                )}

                {c.state.kind === 'owned' && (() => {
                    const tenant = c.state.tenant;
                    return (
                        <GlassCard variant="static" maxWidth="100%">
                            <h1 className="text-2xl font-bold heading-gradient mb-6">{tenant.name}</h1>

                            <div className="bg-[var(--color-surface-inner)] rounded-xl p-4 font-mono text-xs mb-6 grid gap-1.5">
                                <div><span className="text-[var(--color-text-muted)]">tenant_id </span>{tenant.id}</div>
                                <div><span className="text-[var(--color-text-muted)]">slug </span>{tenant.slug}</div>
                            </div>

                            <button
                                type="button"
                                className="btn-gold mb-3"
                                disabled={c.busy}
                                onClick={() => void c.downloadKit(tenant, 'zip')}
                            >
                                {c.busy ? 'Descargando...' : 'Descargar kit de integración'}
                            </button>

                            <div className="flex gap-3 flex-wrap">
                                <button
                                    type="button"
                                    className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border-soft)] text-[var(--color-info-fg)] font-mono text-sm hover:border-[var(--color-info-accent)] transition-colors disabled:opacity-50"
                                    disabled={c.busy}
                                    onClick={() => void c.downloadKit(tenant, 'md')}
                                >
                                    INTEGRATION.md
                                </button>
                                <button
                                    type="button"
                                    className="flex-1 px-4 py-3 rounded-xl border border-[var(--color-border-soft)] text-[var(--color-info-fg)] font-mono text-sm hover:border-[var(--color-info-accent)] transition-colors disabled:opacity-50"
                                    disabled={c.busy}
                                    onClick={() => void c.downloadKit(tenant, 'llms')}
                                >
                                    llms.txt
                                </button>
                            </div>
                        </GlassCard>
                    );
                })()}

                <div className="text-center mt-6">
                    <a href="/dashboard" className="text-[var(--color-info-fg)] text-sm">
                        Dashboard
                    </a>
                </div>
            </div>
        </PageShell>
    );
}

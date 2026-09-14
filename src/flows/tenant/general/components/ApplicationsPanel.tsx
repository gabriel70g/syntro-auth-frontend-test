'use client';

import { GlassCard } from '@common/components/GlassCard';
import { Banner } from '@common/components/Banner';
import { FormField } from '@common/components/FormField';
import { Spinner } from '@common/components/Spinner';
import { formatApiError } from '@common/api/mappers/api-error.mapper';
import { useApplicationsController } from '@flows/tenant/general/hooks/useApplicationsController';

const secondaryButton =
    'px-3 py-2 rounded-lg border border-[var(--color-border-soft)] text-[var(--color-info-fg)] text-xs font-semibold hover:border-[var(--color-info-accent)] transition-colors disabled:opacity-50';

/**
 * Why: Gestión de las aplicaciones del tenant dentro de la pantalla de la empresa.
 * Cada app declara sus orígenes (CORS y redirect de OAuth) y tiene un id público para X-App-Id.
 */
export function ApplicationsPanel({ tenantId }: { readonly tenantId: string }) {
    const c = useApplicationsController(tenantId);
    const atLimit = c.list.kind === 'loaded' && c.list.items.length >= c.list.max;

    return (
        <GlassCard variant="static" maxWidth="100%" className="mt-6">
            <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <h2 className="text-xl font-bold heading-gradient m-0">Aplicaciones</h2>
                {c.list.kind === 'loaded' && (
                    <span className="text-xs text-[var(--color-text-muted)] font-mono">
                        {c.list.items.length} de {c.list.max}
                    </span>
                )}
            </div>

            {c.error && (
                <Banner variant="error" className="mb-4">
                    <p className="m-0 font-mono text-sm">{formatApiError(c.error)}</p>
                </Banner>
            )}

            {c.list.kind === 'loading' && (
                <div className="flex justify-center py-6">
                    <Spinner />
                </div>
            )}

            {c.list.kind === 'error' && (
                <div className="flex flex-col gap-3">
                    <Banner variant="error">
                        <p className="m-0 font-mono text-sm">{formatApiError(c.list.error)}</p>
                    </Banner>
                    <button type="button" className={secondaryButton} onClick={() => void c.reload()}>
                        Reintentar
                    </button>
                </div>
            )}

            {c.list.kind === 'loaded' && (
                <>
                    {c.list.items.length === 0 && c.form.kind === 'closed' && (
                        <p className="text-sm text-[var(--color-text-muted)] mb-4">
                            Todavía no hay aplicaciones. Creá una por cada frontend o sistema que use este login.
                        </p>
                    )}

                    <ul className="flex flex-col gap-3 mb-4 p-0 list-none">
                        {c.list.items.map((app) => (
                            <li key={app.id} className="bg-[var(--color-surface-inner)] rounded-xl p-4">
                                <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                                    <span className="font-semibold">{app.name}</span>
                                    <span className={`text-xs font-mono ${app.isActive ? 'text-[var(--color-success-fg)]' : 'text-[var(--color-text-muted)]'}`}>
                                        {app.isActive ? 'activa' : 'inactiva'}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 flex-wrap font-mono text-xs mb-2">
                                    <span className="text-[var(--color-text-muted)]">X-App-Id</span>
                                    <span className="break-all">{app.id}</span>
                                    <button type="button" className={secondaryButton} onClick={() => void c.copyId(app.id)}>
                                        {c.copiedId === app.id ? 'Copiado' : 'Copiar'}
                                    </button>
                                </div>

                                <div className="font-mono text-xs mb-3">
                                    <span className="text-[var(--color-text-muted)]">orígenes </span>
                                    {app.allowedOrigins.length === 0 ? '(ninguno)' : app.allowedOrigins.join(', ')}
                                </div>

                                <div className="flex gap-2 flex-wrap">
                                    <button type="button" className={secondaryButton} disabled={c.busy} onClick={() => c.openEdit(app)}>
                                        Editar
                                    </button>
                                    <button type="button" className={secondaryButton} disabled={c.busy} onClick={() => void c.toggleActive(app)}>
                                        {app.isActive ? 'Desactivar' : 'Activar'}
                                    </button>
                                    <button type="button" className={secondaryButton} disabled={c.busy} onClick={() => void c.remove(app)}>
                                        {c.pendingDeleteId === app.id ? 'Confirmar borrado' : 'Borrar'}
                                    </button>
                                    {c.pendingDeleteId === app.id && (
                                        <button type="button" className={secondaryButton} disabled={c.busy} onClick={c.cancelDelete}>
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>

                    {c.form.kind === 'closed' ? (
                        <button type="button" className="btn-gold" disabled={c.busy || atLimit} onClick={c.openCreate}>
                            Nueva aplicación
                        </button>
                    ) : (
                        <form onSubmit={c.submit} className="flex flex-col gap-4">
                            <FormField
                                id="applicationName"
                                label="Nombre"
                                value={c.name}
                                onChange={(e) => c.setName(e.target.value)}
                                disabled={c.busy}
                                autoComplete="off"
                            />
                            <div className="flex flex-col gap-2">
                                <label
                                    htmlFor="applicationOrigins"
                                    className="text-[var(--color-text-medium)] text-sm font-semibold tracking-wide"
                                >
                                    Orígenes permitidos (uno por línea)
                                </label>
                                <textarea
                                    id="applicationOrigins"
                                    className="form-input-base min-h-24 font-mono text-sm"
                                    value={c.originsText}
                                    onChange={(e) => c.setOriginsText(e.target.value)}
                                    disabled={c.busy}
                                    placeholder="https://app.tuempresa.com"
                                    spellCheck={false}
                                />
                                <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-snug">
                                    scheme://host[:port], sin rutas. https salvo localhost.
                                </p>
                            </div>
                            <div className="flex gap-3 flex-wrap">
                                <button type="submit" className="btn-gold" disabled={c.busy}>
                                    {c.busy ? 'Guardando...' : c.form.kind === 'create' ? 'Crear aplicación' : 'Guardar cambios'}
                                </button>
                                <button type="button" className={secondaryButton} disabled={c.busy} onClick={c.closeForm}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    )}
                </>
            )}
        </GlassCard>
    );
}

'use client';

import { useState } from 'react';
import { BRAND } from '@common/lib/brand';
import { useAdminUsersController } from '@flows/admin/users/hooks/useAdminUsersController';
import { UserRow } from '@flows/admin/users/components/UserRow';
import { StepUpModal } from '@flows/admin/users/components/StepUpModal';
import { TwoFactorModal } from '@flows/admin/users/components/TwoFactorModal';
import { RestrictedAccess } from '@flows/admin/users/components/RestrictedAccess';
import '@flows/admin/users/admin-users.css';

export function AdminUsersScreen() {
    const c = useAdminUsersController();
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [show2fa, setShow2fa] = useState(false);
    // Tu propio usuario en el listado (para el modal de 2FA: estado actual + email).
    const selfUser = c.users.find((u) => u.email === c.selfEmail);

    // Guard: esto es para pocos. Si el rol no es admin, no se muestra nada operable.
    if (c.role !== null && c.role !== 'admin') {
        return (
            <div className="sec-shell">
                <RestrictedAccess />
            </div>
        );
    }

    const toggleExpand = (id: string) => setExpandedId((prev) => (prev === id ? null : id));

    return (
        <div className="sec-shell">
            <header className="sec-header">
                <div className="sec-header__main">
                    <p className="sec-eyebrow">{BRAND.name} · consola de seguridad</p>
                    <h1 className="sec-title">Usuarios</h1>
                    <p className="sec-subtitle">
                        Sistema nervioso de la suite — acceso para pocos. Revocar, suspender y quitar
                        exigen 2FA fresco (step-up).
                    </p>
                </div>
                {c.selfEmail && (
                    <div className="sec-session">
                        <a className="sec-nav" href="/tenant">
                            Empresa y aplicaciones
                        </a>
                        <span className="sec-session__email">{c.selfEmail}</span>
                        <button className="sec-logout" onClick={() => void c.logout()}>
                            Salir
                        </button>
                    </div>
                )}
            </header>

            {c.isLoading && <p className="sec-hint">Cargando usuarios…</p>}
            {c.error && <p className="sec-error">{c.error}</p>}

            {!c.isLoading && !c.error && (
                <div className="sec-table-wrap">
                    <table className="sec-table">
                        <thead>
                            <tr>
                                <th>Email</th>
                                <th>Rol</th>
                                <th>Estado</th>
                                <th>2FA</th>
                                <th>Creado</th>
                                <th className="sec-actions-col">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {c.users.map((user) => (
                                <UserRow
                                    key={user.id}
                                    user={user}
                                    isSelf={user.email === c.selfEmail}
                                    isExpanded={expandedId === user.id}
                                    onView={() => toggleExpand(user.id)}
                                    onManage2fa={() => setShow2fa(true)}
                                    onRevoke={() => c.setPending(c.actions.revokeSessions(user))}
                                    onToggle={() => c.setPending(c.actions.toggleAction(user))}
                                    onRemove={() => c.setPending(c.actions.remove(user))}
                                />
                            ))}
                        </tbody>
                    </table>
                    <p className="sec-footnote">
                        {c.users.length} usuario{c.users.length === 1 ? '' : 's'} · toda acción sensible
                        pide 2FA (step-up, acr=high).
                    </p>
                </div>
            )}

            {c.pending && (
                <StepUpModal
                    action={c.pending}
                    onClose={() => c.setPending(null)}
                    onDone={() => {
                        c.setPending(null);
                        void c.reload();
                    }}
                />
            )}

            {show2fa && selfUser && (
                <TwoFactorModal
                    enabled={selfUser.twoFactorEnabled}
                    email={selfUser.email}
                    onClose={() => setShow2fa(false)}
                    onDone={() => {
                        setShow2fa(false);
                        void c.reload();
                    }}
                />
            )}
        </div>
    );
}

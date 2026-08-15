'use client';

import { BRAND } from '@common/lib/brand';
import { statusOf, type AdminUser } from '@common/domain/admin.domain';
import { useAdminUsersController } from '@flows/admin/users/hooks/useAdminUsersController';
import '@flows/admin/users/admin-users.css';

function StatusBadge({ user }: { user: AdminUser }) {
    const s = statusOf(user);
    return <span className={`sec-badge sec-badge--${s}`}>{s}</span>;
}

function formatDate(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function AdminUsersScreen() {
    const c = useAdminUsersController();

    if (c.role !== null && c.role !== 'admin') {
        return (
            <div className="sec-shell">
                <div className="sec-restricted">
                    <p className="sec-restricted__title">Acceso restringido</p>
                    <p className="sec-restricted__body">
                        Esta es la consola de seguridad de la suite. Requiere rol de administrador.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="sec-shell">
            <header className="sec-header">
                <p className="sec-eyebrow">{BRAND.name} · consola de seguridad</p>
                <h1 className="sec-title">Usuarios</h1>
                <p className="sec-subtitle">
                    Sistema nervioso de la suite — acceso para pocos. Las acciones sensibles
                    (revocar, suspender, quitar) exigen 2FA fresco.
                </p>
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
                            </tr>
                        </thead>
                        <tbody>
                            {c.users.map((u) => (
                                <tr key={u.id}>
                                    <td className="sec-email">
                                        {u.email}
                                        {u.email === c.selfEmail && <span className="sec-you">vos</span>}
                                    </td>
                                    <td>
                                        <span className={`sec-role sec-role--${u.role}`}>{u.role}</span>
                                    </td>
                                    <td><StatusBadge user={u} /></td>
                                    <td>
                                        {u.twoFactorEnabled ? (
                                            <span className="sec-2fa sec-2fa--on">activo</span>
                                        ) : (
                                            <span className="sec-2fa sec-2fa--off">sin 2FA</span>
                                        )}
                                    </td>
                                    <td className="sec-muted">{formatDate(u.createdAt)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="sec-footnote">
                        {c.users.length} usuario{c.users.length === 1 ? '' : 's'} ·
                        revocar / suspender / quitar llegan con el paso de 2FA (step-up).
                    </p>
                </div>
            )}
        </div>
    );
}

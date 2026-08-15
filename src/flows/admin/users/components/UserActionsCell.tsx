import { statusOf, type AdminUser } from '@common/domain/admin.domain';

/**
 * Why: acciones por usuario, presentacional puro. No conoce la API ni el step-up: recibe los
 * handlers ya armados (inversión de dependencias). Decide "Suspender vs Reactivar" según el estado.
 */
interface UserActionsCellProps {
    user: AdminUser;
    isSelf: boolean;
    onView: () => void;
    onManage2fa: () => void;
    onRevoke: () => void;
    onToggle: () => void;
    onRemove: () => void;
}

export const UserActionsCell = ({
    user,
    isSelf,
    onView,
    onManage2fa,
    onRevoke,
    onToggle,
    onRemove,
}: UserActionsCellProps) => {
    const isActive = statusOf(user) === 'activo';
    // Sobre uno mismo NO se opera (evita auto-bloqueo): revocar/suspender/quitar quedan deshabilitados.
    // La EXCEPCIÓN es tu propio 2FA — es autoservicio de seguridad, no una acción admin sobre otro:
    // por eso el botón 2FA se habilita SOLO en tu fila.
    const selfLock = isSelf ? 'No podés operar sobre tu propio usuario' : undefined;
    return (
        <div className="sec-actions">
            <button className="sec-act" onClick={onView}>
                Ver
            </button>
            {isSelf && (
                <button className="sec-act sec-act--2fa" onClick={onManage2fa}>
                    {user.twoFactorEnabled ? 'Gestionar 2FA' : 'Activar 2FA'}
                </button>
            )}
            <button
                className="sec-act sec-act--warn"
                onClick={onRevoke}
                disabled={isSelf}
                title={selfLock}
            >
                Revocar
            </button>
            <button className="sec-act" onClick={onToggle} disabled={isSelf} title={selfLock}>
                {isActive ? 'Suspender' : 'Reactivar'}
            </button>
            <button
                className="sec-act sec-act--danger"
                onClick={onRemove}
                disabled={isSelf}
                title={selfLock}
            >
                Quitar
            </button>
        </div>
    );
};

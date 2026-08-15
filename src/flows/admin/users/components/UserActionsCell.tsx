import { statusOf, type AdminUser } from '@common/domain/admin.domain';

/**
 * Why: acciones por usuario, presentacional puro. No conoce la API ni el step-up: recibe los
 * handlers ya armados (inversión de dependencias). Decide "Suspender vs Reactivar" según el estado.
 */
interface UserActionsCellProps {
    user: AdminUser;
    isSelf: boolean;
    onView: () => void;
    onRevoke: () => void;
    onToggle: () => void;
    onRemove: () => void;
}

export const UserActionsCell = ({
    user,
    isSelf,
    onView,
    onRevoke,
    onToggle,
    onRemove,
}: UserActionsCellProps) => {
    const isActive = statusOf(user) === 'activo';
    // Sobre uno mismo no se opera (evita auto-bloqueo). Solo "Ver" queda habilitado.
    const selfLock = isSelf ? 'No podés operar sobre tu propio usuario' : undefined;
    return (
        <div className="sec-actions">
            <button className="sec-act" onClick={onView}>
                Ver
            </button>
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

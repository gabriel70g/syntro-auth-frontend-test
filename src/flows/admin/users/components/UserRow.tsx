import { Fragment } from 'react';
import type { AdminUser } from '@common/domain/admin.domain';
import { formatDate } from '@flows/admin/users/lib/format';
import { UserStatusBadge } from '@flows/admin/users/components/UserStatusBadge';
import { TwoFactorBadge } from '@flows/admin/users/components/TwoFactorBadge';
import { UserActionsCell } from '@flows/admin/users/components/UserActionsCell';
import { UserDetailRow } from '@flows/admin/users/components/UserDetailRow';

/**
 * Why: una fila de usuario. Compone badges + acciones + detalle. Presentacional puro:
 * todo lo que produce efectos llega como callback desde el contenedor.
 */
interface UserRowProps {
    user: AdminUser;
    isSelf: boolean;
    isExpanded: boolean;
    onView: () => void;
    onRevoke: () => void;
    onToggle: () => void;
    onRemove: () => void;
}

export const UserRow = ({ user, isSelf, isExpanded, onView, onRevoke, onToggle, onRemove }: UserRowProps) => (
    <Fragment>
        <tr>
            <td className="sec-email">
                {user.email}
                {isSelf && <span className="sec-you">vos</span>}
            </td>
            <td>
                <span className={`sec-role sec-role--${user.role}`}>{user.role}</span>
            </td>
            <td>
                <UserStatusBadge user={user} />
            </td>
            <td>
                <TwoFactorBadge enabled={user.twoFactorEnabled} />
            </td>
            <td className="sec-muted">{formatDate(user.createdAt)}</td>
            <td className="sec-actions">
                <UserActionsCell
                    user={user}
                    isSelf={isSelf}
                    onView={onView}
                    onRevoke={onRevoke}
                    onToggle={onToggle}
                    onRemove={onRemove}
                />
            </td>
        </tr>
        {isExpanded && <UserDetailRow user={user} />}
    </Fragment>
);

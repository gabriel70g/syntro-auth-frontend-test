import type { AdminUser } from '@common/domain/admin.domain';
import { formatDate } from '@flows/admin/users/lib/format';

const yesNo = (v: boolean): string => (v ? 'sí' : 'no');

const Field = ({ label, value }: { label: string; value: string }) => (
    <span>
        <b>{label}</b> {value}
    </span>
);

/** Why: detalle expandido de un usuario, presentacional puro. */
export const UserDetailRow = ({ user }: { user: AdminUser }) => (
    <tr className="sec-detail-row">
        <td colSpan={6}>
            <div className="sec-detail">
                <Field label="ID" value={user.id} />
                <Field label="Email verificado" value={yesNo(user.isEmailVerified)} />
                <Field label="Activo" value={yesNo(user.isActive)} />
                <Field label="Suspendido" value={yesNo(user.isSuspended)} />
                <Field label="Baneado" value={yesNo(user.isBanned)} />
                <Field label="2FA" value={user.twoFactorEnabled ? 'activo' : 'no'} />
                <Field label="Actualizado" value={formatDate(user.updatedAt)} />
            </div>
        </td>
    </tr>
);

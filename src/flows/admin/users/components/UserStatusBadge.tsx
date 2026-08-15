import { statusOf, type AdminUser } from '@common/domain/admin.domain';

/** Why: badge de estado, presentacional puro (deriva del dominio, sin efectos). */
export const UserStatusBadge = ({ user }: { user: AdminUser }) => {
    const status = statusOf(user);
    return <span className={`sec-badge sec-badge--${status}`}>{status}</span>;
};

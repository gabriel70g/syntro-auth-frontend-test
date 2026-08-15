/**
 * Why: modelo de usuario para la consola de seguridad (admin). Refleja lo que devuelve
 * GET /api/users de syntroAuth. NO incluimos passwordHash a propósito (la API lo expone,
 * pero no se muestra ni se guarda en el front — es material sensible).
 */
export interface AdminUser {
    id: string;
    email: string;
    role: string;
    isActive: boolean;
    isBanned: boolean;
    isSuspended: boolean;
    isDeleted: boolean;
    twoFactorEnabled: boolean;
    isEmailVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export type UserStatus = 'activo' | 'suspendido' | 'baneado' | 'eliminado' | 'inactivo';

/** Estado efectivo, en orden de severidad (eliminado gana sobre baneado, etc.). */
export function statusOf(u: AdminUser): UserStatus {
    if (u.isDeleted) return 'eliminado';
    if (u.isBanned) return 'baneado';
    if (u.isSuspended) return 'suspendido';
    if (!u.isActive) return 'inactivo';
    return 'activo';
}

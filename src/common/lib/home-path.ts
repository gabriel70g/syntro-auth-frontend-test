/**
 * Why: Destino después del login. El admin global va a la consola de usuarios; el resto va a su
 * empresa, donde crea el tenant si todavía no tiene (caso Google) o descarga el kit.
 */
export function homePathForRole(role: string | undefined): string {
    return role === 'admin' ? '/admin/users' : '/tenant';
}

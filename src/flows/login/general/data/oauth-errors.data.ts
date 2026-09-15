/**
 * Why: `/login?error=` solo muestra mensajes de esta lista cerrada. Un valor que no está se ignora: la query no
 * decide qué texto ve el usuario.
 */
const OAUTH_ERRORS: Readonly<Record<string, string>> = {
    oauth: 'No se pudo iniciar sesión con Google. Probá de nuevo.',
    oauth_state: 'No se pudo validar el inicio de sesión con Google en este navegador. Probá de nuevo.',
    oauth_config: 'El inicio de sesión con Google no está disponible.',
    oauth_unavailable: 'El servicio de autenticación no responde. Probá de nuevo en unos segundos.',
};

export function oauthErrorMessage(code: string | undefined): string {
    return code && Object.hasOwn(OAUTH_ERRORS, code) ? OAUTH_ERRORS[code] : '';
}

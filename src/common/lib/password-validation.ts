export type PasswordValidationResult = { valid: true } | { valid: false; errors: string[] };

/**
 * Why: Demo/maqueta — solo no vacío, como indica el dashboard; producción debe añadir reglas propias.
 */
export function validatePassword(password: string): PasswordValidationResult {
    const trimmed = password.trim();
    if (trimmed.length === 0) {
        return { valid: false, errors: ['La contraseña no puede estar vacía'] };
    }
    return { valid: true };
}

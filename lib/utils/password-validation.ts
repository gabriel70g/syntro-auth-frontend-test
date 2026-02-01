/**
 * Validación de contraseña en el cliente (SRP).
 * Este frontend usa modo simple (solo no vacío). Otros frontends deben usar
 * validatePasswordStrict() para requisitos de complejidad en producción.
 */

export type PasswordValidationResult =
    | { valid: true }
    | { valid: false; errors: string[] };

/** Requisitos para validación estricta (otros frontends) */
export const STRICT_REQUIREMENTS = {
    minLength: 8,
    needsUppercase: true,
    needsLowercase: true,
    needsNumber: true,
    needsSpecial: true,
} as const;

/**
 * Validación simple: solo exige que no esté vacía.
 * Usado en este frontend de ejemplo.
 */
export function validatePassword(password: string): PasswordValidationResult {
    const trimmed = password.trim();
    if (trimmed.length === 0) {
        return { valid: false, errors: ['La contraseña no puede estar vacía'] };
    }
    return { valid: true };
}

/**
 * Validación estricta con requisitos de complejidad.
 * Los demás frontends deben usar esta función en producción.
 */
export function validatePasswordStrict(password: string): PasswordValidationResult {
    const errors: string[] = [];
    const r = STRICT_REQUIREMENTS;

    if (password.length < r.minLength) errors.push(`Mínimo ${r.minLength} caracteres`);
    if (r.needsUppercase && !/[A-Z]/.test(password)) errors.push('Una mayúscula');
    if (r.needsLowercase && !/[a-z]/.test(password)) errors.push('Una minúscula');
    if (r.needsNumber && !/\d/.test(password)) errors.push('Un número');
    if (r.needsSpecial && !/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
        errors.push('Un carácter especial');
    }

    return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

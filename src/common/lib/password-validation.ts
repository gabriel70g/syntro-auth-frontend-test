export type PasswordValidationResult = { valid: true } | { valid: false; errors: string[] };

export const STRICT_REQUIREMENTS = {
    minLength: 8,
    needsUppercase: true,
    needsLowercase: true,
    needsNumber: true,
    needsSpecial: true,
} as const;

export function validatePassword(password: string): PasswordValidationResult {
    const trimmed = password.trim();
    if (trimmed.length === 0) {
        return { valid: false, errors: ['La contraseña no puede estar vacía'] };
    }
    return { valid: true };
}

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

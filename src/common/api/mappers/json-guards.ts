/**
 * Why: Type-narrowing puro sobre JSON desconocido (sin fetch).
 */

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

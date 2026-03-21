/**
 * Why: Datos estáticos de la demo separados del layout (puro).
 */
export const SECURITY_FEATURES = [
    { name: 'Cifrado RSA-OAEP', desc: 'Contraseña cifrada con clave pública antes de enviar' },
    { name: 'Validación en cliente (SRP)', desc: 'Contraseña validada antes de enviar; no vacía' },
    { name: 'Anti-replay', desc: 'Seed único por intento, consumido una sola vez' },
    {
        name: 'Argon2id',
        desc: 'Hashing configurable (16/32/64MB) con versionado automático. Cada hash recuerda sus parámetros originales; migración gradual sin re-encriptar. El móvil solo cifra con RSA, sin carga pesada.',
    },
    { name: 'Rate limiting', desc: '5 intentos / 15 min por IP en login' },
    { name: 'Refresh Token Rotation', desc: 'Rotación de tokens + detección de robo' },
    { name: 'JWT firmado', desc: 'RS256/HS256, validación de firma en cada request' },
    { name: 'Multi-tenant', desc: 'Aislamiento por tenant' },
    { name: 'Auditoría', desc: 'Eventos sensibles registrados' },
] as const;

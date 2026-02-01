/**
 * Utilidades para cifrado asimétrico (RSA) en el cliente.
 * Usa Web Crypto API (nativo en navegadores modernos).
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Convierte un PEM a un ArrayBuffer consumible por Web Crypto API.
 */
function pemToArrayBuffer(pem: string): ArrayBuffer {
    const b64 = pem
        .replace(/-----BEGIN PUBLIC KEY-----/, '')
        .replace(/-----END PUBLIC KEY-----/, '')
        .replace(/\s/g, '');
    const binary = window.atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
}

/**
 * Obtiene la clave pública y el seed de seguridad del servidor, y cifra el payload.
 */
export async function encryptPassword(password: string): Promise<string> {
    try {
        // 1. Obtener la clave pública + seed del backend (Handshake Senior)
        const response = await fetch(`${API_URL}/api/auth/security/public-key`);
        if (!response.ok) throw new Error('No se pudo obtener la clave pública de seguridad');

        const pem = await response.text();
        const seed = response.headers.get('X-Correlation-Id') || '';

        // 2. Importar la clave
        const keyBuffer = pemToArrayBuffer(pem);
        const publicKey = await window.crypto.subtle.importKey(
            'spki',
            keyBuffer,
            {
                name: 'RSA-OAEP',
                hash: 'SHA-256',
            },
            true,
            ['encrypt']
        );

        // 3. Preparar payload combinado "password:seed" (Anti-Replay)
        const combinedPayload = `${password}:${seed}`;
        const encodedData = new TextEncoder().encode(combinedPayload);

        // 4. Cifrar los datos
        const encryptedBuffer = await window.crypto.subtle.encrypt(
            {
                name: 'RSA-OAEP',
            },
            publicKey,
            encodedData
        );

        // 5. Convertir a Base64 para envío seguro
        return window.btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
    } catch (error) {
        console.error('Error en el cifrado de seguridad:', error);
        throw new Error('Error al preparar la conexión segura. Inténtelo de nuevo.');
    }
}

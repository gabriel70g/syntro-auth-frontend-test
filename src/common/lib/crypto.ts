import { API_URL } from '@common/lib/config';

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
 * Why: Handshake RSA-OAEP con el backend; efecto de red aislado (único lugar permitido aquí).
 */
export async function encryptPassword(password: string): Promise<string> {
    const response = await fetch(`${API_URL}/api/auth/security/public-key`);
    if (!response.ok) throw new Error('No se pudo obtener la clave pública de seguridad');

    const pem = await response.text();
    const seed = response.headers.get('X-Correlation-Id') || '';

    const keyBuffer = pemToArrayBuffer(pem);
    const publicKey = await window.crypto.subtle.importKey(
        'spki',
        keyBuffer,
        { name: 'RSA-OAEP', hash: 'SHA-256' },
        true,
        ['encrypt']
    );

    const combinedPayload = `${password}:${seed}`;
    const encodedData = new TextEncoder().encode(combinedPayload);
    const encryptedBuffer = await window.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, encodedData);

    return window.btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
}

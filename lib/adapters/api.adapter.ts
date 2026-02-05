import type { ApiResponse, ApiLoginResponse } from '@/lib/types/api.types';
import type { AuthSession } from '@/lib/types/auth.types';

/**
 * Adaptador para convertir respuestas del backend a modelos de dominio
 * Capa ACL (Anti-Corruption Layer)
 */

export const apiAdapter = {
    /**
     * Convierte la respuesta de login del backend al modelo de dominio AuthSession
     */
    toAuthSession(apiResponse: ApiResponse<ApiLoginResponse>): AuthSession | null {
        // Guard clause: validar que la respuesta sea exitosa
        if (!apiResponse.success) {
            return null;
        }

        // Check if it is MFA Required response, in which case it is not a valid session yet
        if ('result' in apiResponse.data && apiResponse.data.result === 'mfa_required') {
            return null;
        }

        // It must be ApiLoginSuccessResponse now
        // We cast or use property check. Since we ruled out mfa_required, and union has only 2 types...
        // safety check for accessToken
        if (!('accessToken' in apiResponse.data)) {
            return null;
        }

        const { accessToken, refreshToken } = apiResponse.data;

        // Guard clause: validar tokens
        if (!accessToken || !refreshToken) {
            return null;
        }

        // Decodificar JWT para extraer información del usuario
        // El JWT tiene 3 partes separadas por puntos: header.payload.signature
        try {
            const payloadBase64 = accessToken.split('.')[1];
            const payloadJson = atob(payloadBase64);
            const payload = JSON.parse(payloadJson);

            // Guard clause: validar datos del usuario en el JWT
            if (!payload.sub || !payload.email) {
                return null;
            }

            return {
                token: accessToken,
                refreshToken,
                user: {
                    id: payload.sub,
                    email: payload.email,
                    name: payload.email.split('@')[0], // Usar parte del email como nombre
                    role: payload.role,
                },
            };
        } catch (error) {
            console.error('Error decodificando JWT:', error);
            return null;
        }
    },

    /**
     * Extrae mensaje de error de la respuesta de API
     */
    getErrorMessage(apiResponse: ApiResponse<unknown>): string {
        // Guard clause: si es exitosa, no hay error
        if (apiResponse.success) {
            return '';
        }

        return apiResponse.error?.message || 'Ha ocurrido un error inesperado';
    },
};

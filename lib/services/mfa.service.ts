import { API_URL, getDefaultHeaders } from '@/lib/constants/config';
import { apiAdapter } from '@/lib/adapters/api.adapter';
import type { ApiResponse, ApiMfaSetupResponse, ApiLoginResponse } from '@/lib/types/api.types';
import type { MfaSetupResult, LoginResult } from '@/lib/types/auth.types';

export const mfaService = {
    /**
     * Inicia el proceso de setup 2FA
     * POST /api/auth/mfa/setup
     * @param token Optional token override (e.g. TempToken during enforced setup)
     */
    async initiateSetup(token?: string): Promise<MfaSetupResult> {
        try {
            const headers = getDefaultHeaders();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_URL}/api/auth/mfa/setup`, {
                method: 'POST',
                headers,
            });

            const apiResponse: ApiResponse<ApiMfaSetupResponse> = await response.json();

            if (!response.ok || !apiResponse.success) {
                return {
                    success: false,
                    error: apiAdapter.getErrorMessage(apiResponse as any) || 'Error al iniciar setup MFA',
                };
            }

            return {
                success: true,
                secret: apiResponse.data.secret,
                qrCodeUri: apiResponse.data.qrCodeUri,
                manualEntryKey: apiResponse.data.manualEntryKey,
            };
        } catch (error) {
            console.error('Error initiating MFA setup:', error);
            return { success: false, error: 'Error de conexión' };
        }
    },

    /**
     * Habilita 2FA verificando el código y la contraseña actual
     * POST /api/auth/mfa/enable
     * @param token Optional token override
     */
    async enable(code: string, password: string, token?: string): Promise<{ success: boolean; error?: string }> {
        try {
            const headers = getDefaultHeaders();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${API_URL}/api/auth/mfa/enable`, {
                method: 'POST',
                headers,
                body: JSON.stringify({ code, password }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                return {
                    success: false,
                    error: errorData.error?.message || 'Error al habilitar MFA'
                };
            }

            return { success: true };
        } catch (error) {
            console.error('Error enabling MFA:', error);
            return { success: false, error: 'Error de conexión' };
        }
    },

    /**
     * Verifica el desafío de login 2FA
     * POST /api/auth/login/2fa
     */
    async verifyLogin(tempToken: string, code: string): Promise<LoginResult> {
        try {
            const response = await fetch(`${API_URL}/api/auth/login/2fa`, {
                method: 'POST',
                headers: {
                    ...getDefaultHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tempToken, code }),
            });

            const apiResponse: ApiResponse<ApiLoginResponse> = await response.json();

            if (!response.ok) {
                return {
                    success: false,
                    error: apiAdapter.getErrorMessage(apiResponse as any),
                };
            }

            // Aquí convertimos la respuesta (que debe ser tokens) a sesión
            const session = apiAdapter.toAuthSession(apiResponse as any); // as any porque toAuthSession espera ApiLoginResponse concreta

            if (!session) {
                return { success: false, error: 'Sesión inválida recibida del servidor' };
            }

            if (typeof window !== 'undefined') {
                localStorage.setItem('auth_token', session.token);
                if (session.refreshToken) {
                    localStorage.setItem('refresh_token', session.refreshToken);
                }
            }

            return { success: true, session };
        } catch (error) {
            console.error('Error verifying login 2FA:', error);
            return { success: false, error: 'Error de conexión' };
        }
    }
};

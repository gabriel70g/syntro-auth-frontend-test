import type { AuthCredentials, LoginResult, RegisterData, RegisterResult } from '@/lib/types/auth.types';
import type { ApiResponse, ApiLoginResponse } from '@/lib/types/api.types';
import { apiAdapter } from '@/lib/adapters/api.adapter';
import { encryptPassword } from '@/lib/utils/crypto';
import { validatePassword } from '@/lib/utils/password-validation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Servicio de autenticación
 * Maneja la comunicación con el backend y retorna modelos de dominio
 */
export const authService = {
    /**
     * Realiza login y retorna el resultado adaptado
     */
    async login(credentials: AuthCredentials): Promise<LoginResult> {
        // Guard clause: validar credenciales
        if (!credentials.email || !credentials.password) {
            return {
                success: false,
                error: 'Email y contraseña son requeridos',
            };
        }

        try {
            // Cifrar contraseña (Handshake RSA)
            const encryptedPassword = await encryptPassword(credentials.password);

            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: credentials.email,
                    password: encryptedPassword,
                }),
            });

            const apiResponse: ApiResponse<ApiLoginResponse> = await response.json();

            // Guard clause: error de red o servidor
            if (!response.ok) {
                return {
                    success: false,
                    error: apiAdapter.getErrorMessage(apiResponse),
                };
            }

            // Adaptar respuesta a modelo de dominio
            const session = apiAdapter.toAuthSession(apiResponse);

            // Guard clause: sesión inválida
            if (!session) {
                return {
                    success: false,
                    error: 'Respuesta del servidor inválida',
                };
            }

            // Guardar token (HttpOnly cookies es mejor, pero para testing usamos localStorage)
            if (typeof window !== 'undefined') {
                localStorage.setItem('auth_token', session.token);
                if (session.refreshToken) {
                    localStorage.setItem('refresh_token', session.refreshToken);
                }
            }

            return {
                success: true,
                session,
            };
        } catch (error) {
            console.error('Error en login:', error);
            return {
                success: false,
                error: 'Error de conexión con el servidor',
            };
        }
    },

    /**
     * Registra un nuevo usuario y hace login automáticamente
     * Paso 1: POST /api/users para crear el usuario
     * Paso 2: POST /auth/login para obtener tokens
     */
    async register(data: RegisterData): Promise<RegisterResult> {
        // Guard clause: validar datos
        if (!data.email || !data.password) {
            return {
                success: false,
                error: 'Email y contraseña son requeridos',
            };
        }

        // Guard clause: validar complejidad en cliente (SRP)
        const passwordValidation = validatePassword(data.password);
        if (!passwordValidation.valid) {
            return {
                success: false,
                error: `Contraseña: ${passwordValidation.errors.join(', ')}`,
            };
        }

        try {
            // Cifrar contraseña (Handshake RSA)
            const encryptedPassword = await encryptPassword(data.password);

            // Paso 1: Crear usuario
            const createResponse = await fetch(`${API_URL}/api/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.email,
                    password: encryptedPassword,
                }),
            });

            const createResult = await createResponse.json();

            // Guard clause: error al crear usuario
            if (!createResponse.ok) {
                return {
                    success: false,
                    error: createResult.error?.message || 'Error al crear usuario',
                };
            }

            // Paso 2: Hacer login automáticamente con las credenciales
            const loginResult = await this.login({
                email: data.email,
                password: data.password, // el login ya se encarga de cifrarlo
            });

            return loginResult;
        } catch (error) {
            console.error('Error en registro:', error);
            return {
                success: false,
                error: 'Error de conexión con el servidor',
            };
        }
    },

    /**
     * Cierra sesión
     */
    logout(): void {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
        }
    },
};

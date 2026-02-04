import type { AuthCredentials, LoginResult, RegisterData, RegisterResult, OAuthLoginRequest, OAuthLoginResult } from '@/lib/types/auth.types';
import type { ApiResponse, ApiLoginResponse } from '@/lib/types/api.types';
import { apiAdapter } from '@/lib/adapters/api.adapter';
import { encryptPassword } from '@/lib/utils/crypto';
import { validatePassword } from '@/lib/utils/password-validation';
import { buildOAuthUrl, getCurrentRedirectUri } from '@/lib/utils/oauth';

// API URL: Railway por defecto, localhost solo como fallback
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://syntroauth-production.up.railway.app';

/**
 * Servicio de autenticación - Demo/Maqueta SyntroAuth
 * 
 * Maneja la comunicación con el backend y retorna modelos de dominio.
 * 
 * Arquitectura:
 * - Guard Clauses: validación temprana (fail fast)
 * - Programación Funcional: funciones puras donde sea posible
 * - SOLID: Single Responsibility, Dependency Inversion
 * 
 * Ejemplo de integración paso a paso para otros frontends.
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
     * Login con OAuth (Google, Apple, etc.)
     * 
     * El frontend solo pasa el código al backend.
     * El backend es quien intercambia el código por tokens usando Client Secret.
     * 
     * IMPORTANTE: El frontend NO tiene acceso al Client Secret.
     * Solo obtiene Client ID (público) y pasa el código al backend.
     */
    async oauthLogin(request: OAuthLoginRequest): Promise<OAuthLoginResult> {
        // Guard clause: validar request
        if (!request.provider || !request.code || !request.redirectUri) {
            return {
                success: false,
                error: 'Provider, code y redirectUri son requeridos',
            };
        }

        try {
            const response = await fetch(`${API_URL}/api/auth/oauth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    provider: request.provider,
                    code: request.code,
                    redirectUri: request.redirectUri,
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

            // Guardar token
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
            console.error('Error en OAuth login:', error);
            return {
                success: false,
                error: 'Error de conexión con el servidor',
            };
        }
    },

    /**
     * Inicia el flujo OAuth redirigiendo al proveedor
     * 
     * Single Responsibility: solo redirige, la construcción de URL está en utils/oauth.ts
     * 
     * IMPORTANTE: Solo usa Client ID (público) obtenido del backend.
     * El Client Secret nunca se expone al frontend.
     */
    initiateOAuth(provider: string, clientId: string): void {
        // Guard clause: window debe estar disponible (cliente)
        if (typeof window === 'undefined') {
            throw new Error('initiateOAuth solo puede ejecutarse en el cliente');
        }

        // Guard clause: validar parámetros
        if (!provider || !clientId) {
            throw new Error('Provider y clientId son requeridos');
        }

        // Construcción de URL delegada a función pura (programación funcional)
        const redirectUri = getCurrentRedirectUri();
        const authUrl = buildOAuthUrl(provider, clientId, redirectUri, provider);

        // Side effect aislado: solo redirección
        window.location.href = authUrl;
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

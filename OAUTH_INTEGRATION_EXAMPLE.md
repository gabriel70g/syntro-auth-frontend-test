# 🚀 Guía Rápida: Integrar OAuth Google (Copy & Paste)

**Para desarrolladores** - Copiá y pegá estos bloques de código.

## 🔐 Seguridad: ¿Qué Necesita el Frontend?

**✅ CORRECTO:**
- Frontend obtiene Client ID del backend (público, seguro)
- Frontend solo redirige al usuario a Google
- Frontend pasa el código al backend
- Backend hace todo el trabajo pesado (intercambia código, valida, crea tokens)

**❌ INCORRECTO:**
- Frontend NO necesita Client Secret
- Frontend NO hardcodea credenciales
- Frontend NO intercambia códigos directamente

**El frontend es "tonto"**: solo muestra botones y redirige. El backend es el que hace la magia.

---

## ⚡ Versión Ultra-Rápida (30 segundos)

Si solo querés ver cómo funciona, copiá estos 3 archivos:
1. `lib/utils/oauth.ts` → Copiar completo
2. `app/auth/callback/page.tsx` → Copiar completo  
3. `lib/services/auth.service.ts` → Copiar solo los métodos `initiateOAuth` y `oauthLogin`

Y agregá el botón en tu login (ver Paso 4 abajo).

**Listo!** 🎉

---

## 📋 Checklist Completo

1. ✅ Configurar Google OAuth en Google Cloud Console (ver guía en `syntroAuth/_docs`)
2. ✅ Agregar variables de entorno **SOLO EN EL BACKEND**: `OAUTH_GOOGLE_CLIENT_ID` y `OAUTH_GOOGLE_CLIENT_SECRET` en Railway
3. ✅ Copiar estos 3 archivos a tu proyecto frontend
4. ✅ Agregar botón en login
5. ✅ Listo! 🎉

**⚠️ IMPORTANTE:** El frontend **NO necesita credenciales**. Solo obtiene el Client ID (público) del backend automáticamente. El backend hace todo el trabajo pesado.

---

## 📁 Archivo 1: Utilidades OAuth (`lib/utils/oauth.ts`)

**✅ Copiá este archivo completo** - Funciones puras, sin dependencias complejas.

**Ubicación:** `lib/utils/oauth.ts` (o donde guardes tus utilidades)

**Qué hace:**
- Construye URLs de OAuth (Google, Apple, etc.)
- Parsea callbacks de OAuth
- Valida parámetros

**No necesitás modificarlo** - Funciona para todos los proveedores OAuth.

**📝 Nota:** Si no usás TypeScript, convertí los tipos a JavaScript (quitar `: string`, `: boolean`, etc.)

---

## 📁 Archivo 2: Servicio de Auth (`lib/services/auth.service.ts`)

**✅ Agregá estos 2 métodos a tu servicio de autenticación existente**

Si no tenés un servicio de auth, creá uno nuevo con estos métodos.

### Método 1: Iniciar OAuth

```typescript
/**
 * Inicia el flujo OAuth redirigiendo al proveedor (Google, Apple, etc.)
 * 
 * @param provider - Nombre del proveedor ('google', 'apple', etc.)
 * @param clientId - Client ID público del proveedor (se obtiene del backend)
 */
initiateOAuth(provider: string, clientId: string): void {
    // Guard clause: solo ejecutar en cliente
    if (typeof window === 'undefined') {
        throw new Error('initiateOAuth solo puede ejecutarse en el cliente');
    }
    
    // Guard clause: validar parámetros
    if (!provider || !clientId) {
        throw new Error('Provider y clientId son requeridos');
    }

    // Importar funciones puras (ajustá la ruta según tu estructura)
    const { buildOAuthUrl, getCurrentRedirectUri } = require('@/lib/utils/oauth');
    
    // Construir URL de autorización (función pura)
    const redirectUri = getCurrentRedirectUri();
    const authUrl = buildOAuthUrl(provider, clientId, redirectUri, provider);

    // Redirigir al proveedor OAuth
    window.location.href = authUrl;
}
```

**📝 Ajustes necesarios:**
- Cambiá `@/lib/utils/oauth` por la ruta donde copiaste el archivo
- Si usás JavaScript puro, cambiá `require()` por `import`

### Método 2: Login OAuth (intercambiar código por tokens)

```typescript
/**
 * Intercambia el código de autorización OAuth por tokens JWT
 * 
 * @param request - { provider, code, redirectUri }
 * @returns { success, session?, error? }
 */
async oauthLogin(request: { 
    provider: string; 
    code: string; 
    redirectUri: string 
}): Promise<{ 
    success: boolean; 
    session?: { token: string; refreshToken?: string }; 
    error?: string 
}> {
    // Guard clause: validar request
    if (!request.provider || !request.code || !request.redirectUri) {
        return {
            success: false,
            error: 'Provider, code y redirectUri son requeridos',
        };
    }

    try {
        // API URL: Railway por defecto, ajustá si usás otro backend
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://syntroauth-production.up.railway.app';
        
        // Intercambiar código por tokens
        const response = await fetch(`${API_URL}/api/auth/oauth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                provider: request.provider,
                code: request.code,
                redirectUri: request.redirectUri,
            }),
        });

        const apiResponse = await response.json();

        // Guard clause: error del servidor
        if (!response.ok) {
            return {
                success: false,
                error: apiResponse.error?.message || 'Error al autenticar',
            };
        }

        // Guardar tokens (ajustá según tu estrategia: localStorage, cookies, etc.)
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', apiResponse.data.accessToken);
            if (apiResponse.data.refreshToken) {
                localStorage.setItem('refresh_token', apiResponse.data.refreshToken);
            }
        }

        return {
            success: true,
            session: {
                token: apiResponse.data.accessToken,
                refreshToken: apiResponse.data.refreshToken,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: 'Error de conexión con el servidor',
        };
    }
}
```

**📝 Ajustes necesarios:**
- Cambiá `API_URL` si tu backend está en otra URL
- Ajustá cómo guardás los tokens (localStorage, cookies, etc.)

---

## 📁 Archivo 3: Página de Callback (`app/auth/callback/page.tsx`)

**Copiá este archivo completo** - Solo cambiá el estilo si querés.

**Qué hace:**
- Recibe el código de Google
- Lo intercambia por tokens
- Redirige al dashboard

**No necesitás modificarlo** - Funciona automáticamente.

---

## 🎯 Paso 4: Agregar Botón en tu Login

**En tu página de login, agregá estos 3 bloques:**

### 1. Estado para proveedores OAuth

```typescript
// Al inicio de tu componente
const [oauthProviders, setOauthProviders] = useState<Record<string, { enabled: boolean; clientId: string | null }>>({});
```

### 2. Cargar configuración OAuth (useEffect)

```typescript
// Cargar configuración OAuth del backend al montar el componente
useEffect(() => {
    const loadOAuthConfig = async () => {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://syntroauth-production.up.railway.app';
        const response = await fetch(`${API_URL}/api/auth/oauth/config`);
        if (response.ok) {
            const data = await response.json();
            if (data.success && data.data?.providers) {
                setOauthProviders(data.data.providers);
            }
        }
    };
    loadOAuthConfig();
}, []);
```

### 3. Handler para el botón

```typescript
// Handler cuando el usuario hace clic en "Continuar con Google"
const handleOAuthLogin = (provider: string) => {
    const providerConfig = oauthProviders[provider.toLowerCase()];
    
    // Guard clause: verificar que esté disponible
    if (!providerConfig?.enabled || !providerConfig.clientId) {
        setError(`OAuth con ${provider} no está disponible`);
        return;
    }
    
    // Redirigir a OAuth provider
    authService.initiateOAuth(provider, providerConfig.clientId);
};
```

### 4. Botón en tu JSX

```typescript
{/* Mostrar botón solo si Google está habilitado */}
{oauthProviders.google?.enabled && oauthProviders.google.clientId && (
    <button 
        type="button"
        onClick={() => handleOAuthLogin('google')}
        disabled={isLoading}
    >
        Continuar con Google
    </button>
)}
```

**📝 Nota:** El botón solo aparece si Google está configurado en el backend. Esto es automático según las variables de entorno en Railway.

---

## ✅ Eso es Todo!

**Flujo completo:**
1. Usuario hace clic en "Continuar con Google"
2. Se redirige a Google
3. Google redirige a `/auth/callback?code=...`
4. La página de callback intercambia código por tokens
5. Usuario autenticado ✅

---

## 🔧 Configuración en Railway

### Backend (SyntroAuth) - Variables de Entorno

**Estas van SOLO en el backend, el frontend NO las necesita:**

```bash
# Backend (SyntroAuth) - Railway
OAUTH_GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
OAUTH_GOOGLE_CLIENT_SECRET=GOCSPX-tu-secret
```

**El backend usa estas credenciales para:**
- Intercambiar el código de autorización por tokens
- Validar tokens de Google
- Crear/vincular usuarios

### Frontend (tu app) - Variables de Entorno

**El frontend solo necesita saber dónde está el backend:**

```bash
# Frontend (tu app) - Railway
NEXT_PUBLIC_API_URL=https://syntroauth-production.up.railway.app
NEXT_PUBLIC_REDIRECT_URI=https://tu-frontend.up.railway.app
```

**El frontend:**
- ✅ Obtiene el Client ID automáticamente del backend (público, seguro)
- ✅ Solo redirige al usuario a Google
- ✅ Recibe el código y lo pasa al backend
- ❌ **NO tiene acceso al Client Secret** (solo el backend)

---

## 📝 Notas Importantes

1. **Redirect URI en Google Console**: Debe ser exactamente `https://tu-frontend.up.railway.app/auth/callback`
2. **Client ID**: Se obtiene automáticamente del backend via `/api/auth/oauth/config` (no lo hardcodees en el frontend)
3. **Client Secret**: **SOLO va en el backend**, NUNCA en el frontend. El frontend nunca lo ve ni lo necesita.
4. **Flujo de seguridad**:
   - Frontend: Solo redirige con Client ID (público)
   - Backend: Intercambia código con Client ID + Client Secret (privado)
   - Frontend: Recibe tokens JWT del backend
5. **Localhost**: Solo para desarrollo local, Railway es el default

---

## 🆘 ¿Problemas?

- **Error "redirect_uri_mismatch"**: Verificá que el redirect URI en Google Console coincida exactamente
- **Botón no aparece**: Verificá que `OAUTH_GOOGLE_CLIENT_ID` y `OAUTH_GOOGLE_CLIENT_SECRET` estén configurados **en el backend** (Railway). El frontend obtiene el Client ID automáticamente.
- **Error en callback**: Revisá la consola del navegador y los logs del backend

---

---

## 📊 Resumen Visual: Qué Copiar

```
Tu Proyecto/
├── lib/
│   ├── utils/
│   │   └── oauth.ts              ← COPIAR ARCHIVO COMPLETO
│   └── services/
│       └── auth.service.ts       ← AGREGAR 2 MÉTODOS
│
└── app/ (o pages/)
    ├── login/
    │   └── page.tsx              ← AGREGAR 4 BLOQUES DE CÓDIGO
    └── auth/
        └── callback/
            └── page.tsx          ← COPIAR ARCHIVO COMPLETO
```

**Total:**
- ✅ 2 archivos completos para copiar
- ✅ 2 métodos para agregar a tu servicio
- ✅ 4 bloques de código para agregar en login

**Tiempo estimado:** 15-20 minutos

---

## 🎓 Para Desarrolladores

**Si no entendés algo:**
1. Copiá los archivos completos primero
2. Probá que funcione
3. Después leé los comentarios para entender cómo funciona

**La estructura está diseñada para:**
- ✅ Ser fácil de copiar
- ✅ Funcionar sin modificar nada
- ✅ Ser fácil de entender después

**¿Necesitás ayuda?** Revisá los archivos completos en este proyecto como referencia.

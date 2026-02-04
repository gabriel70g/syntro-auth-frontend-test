# SyntroAuth Frontend Demo / Maqueta

**Frontend de demostración para SyntroAuth** - Muestra cómo integrar el servicio de autenticación paso a paso.

## 🎯 Propósito

Esta es una **maqueta/demo** que demuestra:
- ✅ Integración completa con SyntroAuth API
- ✅ Flujo de login con email/password (RSA-OAEP handshake)
- ✅ Flujo OAuth (Google, Apple, Microsoft, etc.)
- ✅ Manejo de tokens JWT y refresh tokens
- ✅ Dashboard con información de seguridad
- ✅ Arquitectura limpia: SOLID, Guard Clauses, Programación Funcional

## ⚠️ Nota Importante

Este proyecto usa **validación de contraseña simplificada** (solo no vacía) **a propósito** para demostrar el flujo básico.

**Si integras SyntroAuth en tu frontend de producción**, **debes** implementar validación de complejidad en el cliente (SRP):
- Usa `validatePasswordStrict()` de `lib/utils/password-validation.ts` o
- Implementa requisitos equivalentes: 8+ caracteres, mayúscula, minúscula, número y carácter especial
- La contraseña no debe enviarse al backend hasta cumplir los requisitos

## 🚀 Configuración para Railway

Este proyecto está **preparado para Railway** por defecto. Las URLs se configuran automáticamente:

- **API Backend**: `NEXT_PUBLIC_API_URL` (default: `https://syntroauth-production.up.railway.app`)
- **Redirect URI OAuth**: `NEXT_PUBLIC_REDIRECT_URI` (default: usa `window.location.origin`)
- **Tenant ID**: `NEXT_PUBLIC_TENANT_ID` (default: tenant de fábrica `a0000000-0000-0000-0000-000000000001`)

### Variables de Entorno (Railway)

```bash
NEXT_PUBLIC_API_URL=https://syntroauth-production.up.railway.app
NEXT_PUBLIC_REDIRECT_URI=https://tu-frontend.up.railway.app
NEXT_PUBLIC_TENANT_ID=a0000000-0000-0000-0000-000000000001
```

**IMPORTANTE**: `NEXT_PUBLIC_TENANT_ID` es requerido para OAuth y multi-tenant. Sin este header, el backend no sabe a qué tenant asignar usuarios de OAuth.

### Desarrollo Local (solo si es necesario)

Si necesitás probar localmente, configura:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5018
NEXT_PUBLIC_REDIRECT_URI=http://localhost:3000
NEXT_PUBLIC_TENANT_ID=a0000000-0000-0000-0000-000000000001
```

## 📚 Guía de Integración Paso a Paso

Esta maqueta muestra cómo integrar SyntroAuth en tu frontend. Cada paso está documentado con ejemplos de código.

### 🚀 ¿Querés integrar OAuth Google rápido?

**👉 Ver [OAUTH_INTEGRATION_EXAMPLE.md](./OAUTH_INTEGRATION_EXAMPLE.md)** - Guía copy & paste para desarrolladores.

**Incluye:**
- ✅ Código listo para copiar y pegar
- ✅ 3 archivos que necesitás copiar
- ✅ Ejemplo de botón en login
- ✅ Configuración de Railway
- ✅ Troubleshooting común

### Estructura del Proyecto

```
app/
  ├── login/page.tsx          # Paso 1: Login con email/password
  ├── auth/callback/page.tsx  # Paso 2: Callback OAuth
  └── dashboard/page.tsx      # Paso 4: Protección de rutas

lib/
  ├── services/
  │   └── auth.service.ts     # Servicio principal (Paso 1, 2, 3)
  ├── utils/
  │   ├── oauth.ts            # Utilidades OAuth (funciones puras)
  │   ├── crypto.ts           # Cifrado RSA-OAEP
  │   └── jwt.ts              # Decodificación de JWT
  └── adapters/
      └── api.adapter.ts      # Adaptador API → Dominio
```

### Paso 1: Login con Email/Password

**Archivos:** `app/login/page.tsx`, `lib/services/auth.service.ts`

**Flujo:**
1. Usuario ingresa email/password
2. Frontend cifra contraseña con RSA-OAEP (handshake)
3. Backend valida y devuelve tokens JWT
4. Frontend guarda tokens

**Código clave:**
```typescript
// Cifrar antes de enviar
const encryptedPassword = await encryptPassword(password);

// Login
const result = await authService.login({ email, password: encryptedPassword });
```

### Paso 2: OAuth (Google, Apple, etc.)

**Archivos:** `app/auth/callback/page.tsx`, `lib/utils/oauth.ts`

**Flujo:**
1. Usuario hace clic en "Continuar con Google"
2. Redirige a Google OAuth
3. Google redirige a `/auth/callback?code=...`
4. Frontend intercambia código por tokens

**Código clave:**
```typescript
// Iniciar OAuth
authService.initiateOAuth('google', clientId);

// En callback: procesar código
const result = await authService.oauthLogin({ provider, code, redirectUri });
```

### Paso 3: Manejo de Tokens

**Archivo:** `lib/services/auth.service.ts`

- Guardar tokens en localStorage (o HttpOnly cookies en producción)
- Refresh token automático (implementar según necesidad)
- Logout limpia tokens

### Paso 4: Dashboard/Protección de Rutas

**Archivo:** `app/dashboard/page.tsx`

**Ejemplo de protección:**
```typescript
useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
        window.location.href = '/login';
        return;
    }
    // Decodificar y mostrar información
}, []);
```

## 🏗️ Arquitectura

Este proyecto sigue principios **SOLID** y **Programación Funcional**:

- **Guard Clauses**: Validación temprana (fail fast)
- **Funciones Puras**: `lib/utils/oauth.ts` - sin side effects
- **Single Responsibility**: Cada función/componente hace una cosa
- **Dependency Inversion**: Servicios dependen de abstracciones

## 🚢 Deploy en Railway

1. Conecta tu repo a Railway
2. Configura variables de entorno:
   - `NEXT_PUBLIC_API_URL`: URL del backend SyntroAuth
   - `NEXT_PUBLIC_REDIRECT_URI`: URL de tu frontend (para OAuth callbacks)
3. Railway detecta Next.js automáticamente
4. Deploy y listo

**Nota:** El proyecto está configurado para Railway por defecto. Localhost solo se usa como fallback si es necesario.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { postVerifyEmailConfirm } from "@common/api/clients/verification.http.client";
import { mapVerifyEmailConfirmBody } from "@common/api/mappers/verify-email.mapper";
import { postAccountMfaConfirmSync } from "@common/api/clients/mfa.http.client";
import { mapMfaConfirmHttpToOutcome } from "@common/api/mappers/mfa.mapper";
import { downloadRecoveryCodesTxt } from "@common/lib/recovery-codes-download";
import { homePathForRole } from "@common/lib/home-path";

/**
 * Why: confirma el email con el token del link. El token lo guardó el servidor en una cookie HttpOnly al abrir el
 * link (la URL ya no lo tiene); `hasToken` dice si esa cookie está. Al confirmar, el BFF deja la sesión en cookies.
 */
export function VerifyEmailScreen({ hasToken }: { hasToken: boolean }) {
    const router = useRouter();

    // Machine State: "verifying" | "verified_setup_needed" | "enabling" | "complete_recovery_codes" | "error"
    const [state, setState] = useState<string>(hasToken ? "verifying" : "error");

    const [message, setMessage] = useState(hasToken ? "Verificando tu correo electrónico..." : "Token no válido o faltante.");
    const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
    const [authenticated, setAuthenticated] = useState(false);
    const [homePath, setHomePath] = useState(homePathForRole(undefined));

    // Inputs
    const [code, setCode] = useState("");

    // Create User Flow Results
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

    useEffect(() => {
        if (!hasToken) return;

        const verifyEmail = async () => {
            const { ok, body } = await postVerifyEmailConfirm();
            if (!ok) {
                setState("error");
                setMessage("Hubo un problema verificando tu correo. El token podría haber expirado.");
                return;
            }
            const v = mapVerifyEmailConfirmBody(body);
            setAuthenticated(v.authenticated);
            setHomePath(homePathForRole(v.role));

            if (v.twoFactorEnabled) {
                setState("success_no_action");
                setMessage("¡Correo verificado exitosamente!");
            } else if (v.twoFactorSecret) {
                setTwoFactorSecret(v.twoFactorSecret);
                setState("verified_setup_needed");
                setMessage("Correo verificado. Ahora configuremos tu seguridad.");
            } else {
                setState("success_no_action");
                setMessage("¡Correo verificado exitosamente!");
            }
        };

        void verifyEmail();
    }, [hasToken]);

    const handleEnableMfa = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!authenticated) {
            alert("Error de sesión: No se recibió token de acceso. Vuelve a iniciar sesión.");
            router.push("/login");
            return;
        }

        setState("enabling");
        setMessage("Activando autenticación de dos factores...");

        const { ok, body } = await postAccountMfaConfirmSync(code);
        const outcome = mapMfaConfirmHttpToOutcome(ok, body);
        if (!outcome.success) {
            setState("verified_setup_needed");
            alert(outcome.error || "Código incorrecto o error al activar 2FA.");
            return;
        }

        setRecoveryCodes(outcome.recoveryCodes ?? []);
        setState("complete_recovery_codes");
        setMessage("¡2FA Activado Exitosamente!");
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copiado!");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[var(--color-surface-bg-from)] text-white p-4 font-sans">
            <div className="w-full max-w-lg p-8 bg-[var(--color-surface-card-strong)] rounded-2xl border border-[var(--color-border-soft)] shadow-2xl">

                {/* Header */}
                <h1 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    SyntroAuth
                </h1>
                <p className="text-center text-[var(--color-text-muted)] mb-8">{message}</p>

                {/* LOADING */}
                {(state === "verifying" || state === "enabling") && (
                    <div className="flex flex-col items-center py-8">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* ERROR */}
                {state === "error" && (
                    <div className="text-center">
                        <div className="text-red-500 text-6xl mb-4">✗</div>
                        <button
                            onClick={() => router.push("/login")}
                            className="px-6 py-2 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised-hover)] text-white rounded-lg transition-colors"
                        >
                            Volver al inicio
                        </button>
                    </div>
                )}

                {/* ALREADY VERIFIED / NO MFA NEEDED */}
                {state === "success_no_action" && (
                    <div className="text-center w-full">
                        <div className="text-green-400 text-6xl mb-6">✓</div>
                        <button
                            onClick={() => router.push("/login")}
                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-all"
                        >
                            Iniciar Sesión
                        </button>
                    </div>
                )}

                {/* SETUP MFA FORM */}
                {state === "verified_setup_needed" && twoFactorSecret && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-[var(--color-surface-inner)] p-6 rounded-lg border border-[var(--color-border-soft)] mb-6">
                            <h3 className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
                                <span>🛡️</span> Configura tu Authenticator
                            </h3>
                            <p className="text-sm text-[var(--color-text-muted)] mb-4">
                                Escanea el QR (si estuviera aquí) o ingresa esta clave manualmente en Google Authenticator / Authy.
                            </p>
                            <div
                                onClick={() => copyToClipboard(twoFactorSecret)}
                                className="bg-[var(--color-surface-raised)] p-4 rounded font-mono text-center tracking-widest text-xl cursor-pointer hover:bg-[var(--color-surface-raised-hover)] hover:text-[var(--color-text-strong)] transition-colors text-blue-300 border border-[var(--color-border-soft)] mb-2"
                            >
                                {twoFactorSecret}
                            </div>
                            <p className="text-xs text-center text-[var(--color-text-dim)]">Click para copiar</p>
                        </div>

                        <form onSubmit={handleEnableMfa} className="space-y-4">
                            {/* Password input removed for Demo */}
                            <div>
                                <label className="block text-sm font-medium text-[var(--color-text-medium)] mb-1">Código de 6 dígitos</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-[var(--color-surface-inner)] border border-[var(--color-border-soft)] rounded-lg px-4 py-3 text-white font-mono text-center text-xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                    placeholder="000 000"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 rounded-lg shadow-lg transform transition hover:scale-[1.02]"
                            >
                                Activar y Finalizar
                            </button>
                        </form>
                    </div>
                )}

                {/* RECOVERY CODES */}
                {state === "complete_recovery_codes" && (
                    <div className="animate-in zoom-in duration-300">
                        <div className="text-center mb-6">
                            <span className="text-5xl">🎉</span>
                            <h2 className="text-xl font-semibold mt-2 text-green-400">¡Cuenta Protegida!</h2>
                            <p className="text-[var(--color-text-muted)] text-sm mt-1">
                                Guardalos en un lugar seguro (gestor de contraseñas o carpeta cifrada). Podés copiarlos o
                                descargar un archivo .txt.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6 bg-[var(--color-surface-inner)] p-4 rounded-xl border border-[var(--color-border-soft)]">
                            {recoveryCodes.map((code, idx) => (
                                <div key={idx} className="font-mono text-sm text-[var(--color-text-medium)] bg-[var(--color-surface-card-strong)] p-2 rounded text-center border border-[var(--color-border-soft)]">
                                    {code}
                                </div>
                            ))}
                        </div>

                        <div className="flex flex-col gap-3">
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => copyToClipboard(recoveryCodes.join("\n"))}
                                    className="flex-1 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised-hover)] text-white py-3 rounded-lg font-medium transition-colors"
                                >
                                    Copiar códigos
                                </button>
                                <button
                                    type="button"
                                    onClick={() => downloadRecoveryCodesTxt(recoveryCodes)}
                                    className="flex-1 bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface-raised-hover)] text-white py-3 rounded-lg font-medium transition-colors"
                                >
                                    Descargar .txt
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => router.push(homePath)}
                                className="w-full bg-white text-black hover:bg-gray-200 font-bold py-3 rounded-lg transition-colors"
                            >
                                Continuar
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

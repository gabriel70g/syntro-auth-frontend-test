"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const router = useRouter();

    // Machine State: "verifying" | "verified_setup_needed" | "enabling" | "complete_recovery_codes" | "error"
    const [state, setState] = useState<string>("verifying");

    const [message, setMessage] = useState("Verificando tu correo electrónico...");
    const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);

    // Inputs
    const [code, setCode] = useState("");

    // Create User Flow Results
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

    useEffect(() => {
        if (!token) {
            setState("error");
            setMessage("Token no válido o faltante.");
            return;
        }

        const verifyEmail = async () => {
            try {
                const response = await fetch("http://localhost:5018/api/auth/verify-email/confirm", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                });

                if (!response.ok) {
                    throw new Error("Error al verificar email");
                }

                const data = await response.json();
                const { twoFactorSecret, twoFactorEnabled, accessToken } = data;

                if (accessToken) {
                    setAccessToken(accessToken);
                }

                if (twoFactorEnabled) {
                    setState("success_no_action");
                    setMessage("¡Correo verificado exitosamente!");
                } else if (twoFactorSecret) {
                    // Needs setup
                    setTwoFactorSecret(twoFactorSecret);
                    setState("verified_setup_needed");
                    setMessage("Correo verificado. Ahora configuremos tu seguridad.");
                } else {
                    // Should not happen typically if logic is correct, but effectively success
                    setState("success_no_action");
                    setMessage("¡Correo verificado exitosamente!");
                }

            } catch (err: any) {
                console.error(err);
                setState("error");
                setMessage("Hubo un problema verificando tu correo. El token podría haber expirado.");
            }
        };

        verifyEmail();
    }, [token]);

    const handleEnableMfa = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accessToken) {
            alert("Error de sesión: No se recibió token de acceso. Vuelve a iniciar sesión.");
            router.push("/login");
            return;
        }

        setState("enabling");
        setMessage("Activando autenticación de dos factores...");

        try {
            // Enable MFA using the token we got from verification
            const enableRes = await fetch("http://localhost:5018/api/auth/mfa/enable", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${accessToken}`
                },
                body: JSON.stringify({ code }) // No password needed for Demo
            });

            if (!enableRes.ok) throw new Error("Código incorrecto o error al activar 2FA.");

            const enableData = await enableRes.json();

            setRecoveryCodes(enableData.recoveryCodes || []);
            setState("complete_recovery_codes");
            setMessage("¡2FA Activado Exitosamente!");

        } catch (err: any) {
            console.error(err);
            setState("verified_setup_needed"); // Go back to form
            alert(err.message || "Error al activar 2FA");
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Copiado!");
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4 font-sans">
            <div className="w-full max-w-lg p-8 bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl">

                {/* Header */}
                <h1 className="text-3xl font-bold mb-2 text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    SyntroAuth
                </h1>
                <p className="text-center text-neutral-400 mb-8">{message}</p>

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
                            className="px-6 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-colors"
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
                        <div className="bg-neutral-950 p-6 rounded-lg border border-neutral-800 mb-6">
                            <h3 className="text-yellow-400 font-bold mb-2 flex items-center gap-2">
                                <span>🛡️</span> Configura tu Authenticator
                            </h3>
                            <p className="text-sm text-neutral-400 mb-4">
                                Escanea el QR (si estuviera aquí) o ingresa esta clave manualmente en Google Authenticator / Authy.
                            </p>
                            <div
                                onClick={() => copyToClipboard(twoFactorSecret)}
                                className="bg-neutral-800 p-4 rounded font-mono text-center tracking-widest text-xl cursor-pointer hover:bg-neutral-700 hover:text-white transition-colors text-blue-300 border border-neutral-700 mb-2"
                            >
                                {twoFactorSecret}
                            </div>
                            <p className="text-xs text-center text-neutral-500">Click para copiar</p>
                        </div>

                        <form onSubmit={handleEnableMfa} className="space-y-4">
                            {/* Password input removed for Demo */}
                            <div>
                                <label className="block text-sm font-medium text-neutral-300 mb-1">Código de 6 dígitos</label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-white font-mono text-center text-xl tracking-widest focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                            <p className="text-neutral-400 text-sm mt-1">Guarda estos códigos de recuperación en un lugar seguro. Los necesitarás si pierdes acceso a tu teléfono.</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-6 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                            {recoveryCodes.map((code, idx) => (
                                <div key={idx} className="font-mono text-sm text-neutral-300 bg-neutral-900 p-2 rounded text-center border border-neutral-800">
                                    {code}
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => copyToClipboard(recoveryCodes.join("\n"))}
                                className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-lg font-medium transition-colors"
                            >
                                Copiar Códigos
                            </button>
                            <button
                                onClick={() => router.push("/dashboard")}
                                className="flex-1 bg-white text-black hover:bg-gray-200 font-bold py-3 rounded-lg transition-colors"
                            >
                                Ir al Dashboard
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Cargando...</div>}>
            <VerifyEmailContent />
        </Suspense>
    );
}

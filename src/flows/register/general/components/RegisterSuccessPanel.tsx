import Link from 'next/link';

type Props = { email: string };

/**
 * Why: Estado final registro (recordatorio verificación email).
 */
export function RegisterSuccessPanel({ email }: Props) {
    return (
        <div className="login-card text-center animate-in fade-in zoom-in duration-500">
            <div className="mb-6 flex justify-center">
                <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center border border-blue-500/20">
                    <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75-4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76"
                        />
                    </svg>
                </div>
            </div>

            <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent mb-2">
                ¡Revisa tu correo!
            </h2>

            <p className="text-neutral-400 mb-6 leading-relaxed">
                Hemos enviado un enlace de confirmación a <br />
                <span className="text-white font-medium">{email}</span>
            </p>

            <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-800 mb-8 text-sm text-neutral-500">
                <p>¿No lo encuentras?</p>
                <ul className="list-disc text-left pl-6 mt-2 space-y-1">
                    <li>Revisa la carpeta de Spam.</li>
                    <li>Busca correos de <strong>onboarding@resend.dev</strong> (Demo).</li>
                </ul>
            </div>

            <Link
                href="/login"
                className="block w-full bg-neutral-800 hover:bg-neutral-700 text-white font-medium py-3 rounded-lg transition-colors border border-neutral-700"
            >
                Volver al Inicio
            </Link>
        </div>
    );
}

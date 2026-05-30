import { InputHTMLAttributes, ReactNode } from 'react';

/**
 * FormField — input con label + icono opcional + slot derecho (toggle, etc.).
 *
 * Centraliza el patrón <label>+<wrapper>+<icon>+<input>+<rightSlot> que se repite
 * en login/register/etc. Usa las utility classes `form-input-base` de globals.css.
 */
interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
    label: string;
    /** Icono SVG a la izquierda del input. */
    leftIcon?: ReactNode;
    /** Slot opcional a la derecha (ej: botón show/hide password). */
    rightSlot?: ReactNode;
    /** Mensaje pequeño bajo el input (ej: hint, validación). */
    hint?: string;
}

export function FormField({
    label,
    id,
    leftIcon,
    rightSlot,
    hint,
    ...inputProps
}: FormFieldProps) {
    const inputId = id ?? `field-${label.replace(/\s+/g, '-').toLowerCase()}`;
    const inputClass = leftIcon ? 'form-input-base form-input-icon' : 'form-input-base';

    return (
        <div className="flex flex-col gap-2">
            <label
                htmlFor={inputId}
                className="text-[var(--color-text-medium)] text-sm font-semibold tracking-wide"
            >
                {label}
            </label>
            <div className="relative flex items-center">
                {leftIcon && (
                    <span className="absolute left-4 w-5 h-5 text-[var(--color-text-dim)] pointer-events-none z-10">
                        {leftIcon}
                    </span>
                )}
                <input id={inputId} className={inputClass} {...inputProps} />
                {rightSlot && (
                    <span className="absolute right-4 z-10">{rightSlot}</span>
                )}
            </div>
            {hint && (
                <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-snug">
                    {hint}
                </p>
            )}
        </div>
    );
}

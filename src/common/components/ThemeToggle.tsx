'use client';

import { useState } from 'react';
import { THEME_COOKIE, type ThemeChoice } from '@common/lib/theme';

/**
 * Why: selector de tema. Sin elección la app sigue al sistema (`color-scheme: light dark` en globals.css); una
 * elección fija `data-theme` en <html> y se guarda en la cookie `sa_theme` para que el servidor la pinte en el
 * próximo render sin parpadeo. La cookie no es secreta (solo "light"/"dark"), por eso no es HttpOnly.
 */

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

const OPTIONS: readonly { value: ThemeChoice; label: string }[] = [
    { value: 'system', label: 'Sistema' },
    { value: 'light', label: 'Claro' },
    { value: 'dark', label: 'Oscuro' },
];

function applyTheme(choice: ThemeChoice): void {
    const root = document.documentElement;
    const secure = window.location.protocol === 'https:' ? '; Secure' : '';
    if (choice === 'system') {
        delete root.dataset.theme;
        document.cookie = `${THEME_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
        return;
    }
    root.dataset.theme = choice;
    document.cookie = `${THEME_COOKIE}=${choice}; Path=/; Max-Age=${ONE_YEAR_SECONDS}; SameSite=Lax${secure}`;
}

export function ThemeToggle({ initial }: { initial: ThemeChoice }) {
    const [choice, setChoice] = useState<ThemeChoice>(initial);

    return (
        <div role="group" aria-label="Tema de colores" className="theme-toggle">
            {OPTIONS.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    aria-pressed={choice === option.value}
                    className="theme-toggle__option"
                    onClick={() => {
                        applyTheme(option.value);
                        setChoice(option.value);
                    }}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

#!/usr/bin/env python3
"""Contraste WCAG AA de los tokens de texto de app/globals.css, en modo claro y oscuro.

Lee cada `--color-X: light-dark(claro, oscuro)` (o un valor fijo) y verifica los pares texto/fondo reales de la app,
componiendo las superficies translúcidas sobre el fondo. Sale con 1 si algún par de texto normal queda < 4.5:1.
Uso: python3 scripts/check-contrast.py   (gate de .claude/rules/00-sf-gate.md y CI)
"""
import pathlib
import re
import sys

CSS = pathlib.Path(__file__).resolve().parent.parent / "app" / "globals.css"

# texto → mínimo. text-disabled solo se usa en placeholders y controles deshabilitados (WCAG los exime); se exige 3.
TEXTS = {
    "text-strong": 4.5, "text-medium": 4.5, "text-muted": 4.5, "text-dim": 4.5, "text-disabled": 3.0,
    "gold-deep": 4.5, "gold-soft": 4.5, "success-fg": 4.5, "success-fg-soft": 4.5, "danger-fg": 4.5, "ok-fg": 4.5,
    "warn-fg": 3.0, "info-fg": 4.5, "action-fg": 4.5,
}
# fondos sobre los que aparecen esos textos
SURFACES = ["body", "card", "card-strong", "inner", "input", "raised"]
# pares fijos: (texto, fondo, mínimo)
FIXED = [
    ("#ffffff", "action-from", 4.5), ("#ffffff", "action-to", 4.5),
    ("#ffffff", "ok-solid-from", 4.5), ("#ffffff", "danger-solid", 4.5),
    ("surface-bg-from", "gold-deep", 4.5),       # texto del botón dorado
    ("on-info-solid", "info-solid-to", 4.5),     # texto de .btn-blue
]


def parse_tokens(css: str) -> dict:
    tokens = {}
    for name, value in re.findall(r"--color-([a-z0-9-]+):\s*([^;]+);", css):
        m = re.match(r"light-dark\((.+),\s*((?:rgba?\([^)]*\)|#[0-9a-fA-F]+))\)\s*$", value.strip())
        tokens[name] = (m.group(1).strip(), m.group(2).strip()) if m else (value.strip(), value.strip())
    return tokens


def rgba(value: str):
    value = value.strip()
    if value.startswith("#"):
        h = value[1:]
        return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (1.0,)
    m = re.match(r"rgba?\(([^)]*)\)", value)
    parts = [p.strip() for p in m.group(1).split(",")]
    return tuple(int(p) for p in parts[:3]) + ((float(parts[3]),) if len(parts) > 3 else (1.0,))


def over(fg, bg):
    a = fg[3]
    return tuple(round(fg[i] * a + bg[i] * (1 - a)) for i in range(3)) + (1.0,)


def luminance(c):
    def channel(v):
        v /= 255
        return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * channel(c[0]) + 0.7152 * channel(c[1]) + 0.0722 * channel(c[2])


def ratio(a, b):
    hi, lo = sorted([luminance(a), luminance(b)], reverse=True)
    return (hi + 0.05) / (lo + 0.05)


def main() -> int:
    tokens = parse_tokens(CSS.read_text())
    failures = 0
    for mode, idx in (("claro", 0), ("oscuro", 1)):
        t = lambda name: rgba(tokens[name][idx])
        bg_from, bg_to = t("surface-bg-from"), t("surface-bg-to")
        body = tuple(round((bg_from[i] + bg_to[i]) / 2) for i in range(3)) + (1.0,)
        card = over(t("surface-card"), body)
        surfaces = {
            "body": body, "card": card, "card-strong": over(t("surface-card-strong"), body),
            "inner": over(t("surface-inner"), card), "input": over(t("surface-input"), card),
            "raised": over(t("surface-raised"), card),
        }
        print(f"── modo {mode}")
        for text, minimum in TEXTS.items():
            fg = t(text)
            worst_surface, worst = min(((s, ratio(fg, surfaces[s])) for s in SURFACES), key=lambda x: x[1])
            ok = worst >= minimum
            failures += 0 if ok else 1
            print(f"  {'✅' if ok else '❌'} {text:16} peor {worst:5.2f} sobre {worst_surface:11} (mínimo {minimum})")
        for fg_name, bg_name, minimum in FIXED:
            fg = rgba(fg_name) if fg_name.startswith("#") else t(fg_name)
            r = ratio(fg, t(bg_name))
            ok = r >= minimum
            failures += 0 if ok else 1
            print(f"  {'✅' if ok else '❌'} {fg_name} sobre {bg_name:14} {r:5.2f} (mínimo {minimum})")
    print(f"\n{'OK' if failures == 0 else f'{failures} par(es) por debajo del mínimo'}")
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    sys.exit(main())

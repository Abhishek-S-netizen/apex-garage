// APEX Theme Engine (Single source of truth for Atelier Design System)
import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'apex_studio_state';
const VERSION = 9;

export const PALETTE = {
    bgGradientStart: '#000000', // Pure Black
    bgGradientEnd: '#000000',
    bgDeep: '#000000',
    defaultAccent: '#1550F0',   // Royal Cobalt Blue
    cardBaseRGB: '14, 14, 16'
};

export const SWATCHES = [
    { color: '#1550F0', label: 'Cobalt Blue' },
    { color: '#E95532', label: 'Vermilion Dock' },
    { color: '#2C3752', label: 'Twilight Slate' },
    { color: '#47C7FC', label: 'Electric Sky Blue' },
    { color: '#FC6200', label: 'Tangerine Racing Orange' },
    { color: '#E5202B', label: 'Rosso Corsa' }
];

export const DEFAULT_THEME_STATE = {
    cardOpacity: 78,
    eyebrowContrast: 50,
    cornerRadius: 18,
    autoAdapt: true,
    customAccent: '#1550F0'
};

function hexToRgb(hex) {
    const clean = hex.replace('#', '');
    const n = parseInt(clean, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgba(c, a) {
    return `rgba(${c.r}, ${c.g}, ${c.b}, ${a})`;
}

function mixWithWhite(c, amt) {
    const r = Math.round(c.r + (255 - c.r) * amt);
    const g = Math.round(c.g + (255 - c.g) * amt);
    const b = Math.round(c.b + (255 - c.b) * amt);
    return '#' + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase();
}

function contrastText(c) {
    const yiq = (c.r * 299 + c.g * 587 + c.b * 114) / 1000;
    return yiq > 155 ? '#0A0A0C' : '#FFFFFF';
}

export function deriveTokens(state) {
    const accentHex = state.autoAdapt
        ? PALETTE.defaultAccent
        : (state.customAccent || PALETTE.defaultAccent);
    const a = hexToRgb(accentHex);
    const alpha = (state.cardOpacity / 100).toFixed(2);
    const r = state.cornerRadius;

    const eyebrowLightness = Math.round(30 + ((state.eyebrowContrast || 50) * 0.35));
    const eyebrowColor = `hsl(204, 25%, ${eyebrowLightness}%)`;

    const css = {
        '--palette-sand': PALETTE.bgGradientStart,
        '--palette-obsidian': PALETTE.bgGradientEnd,
        '--palette-deep': PALETTE.bgDeep,

        '--card-opacity': alpha,
        '--card-surface': `rgba(${PALETTE.cardBaseRGB}, ${alpha})`,
        '--card-glass': `rgba(${PALETTE.cardBaseRGB}, ${alpha})`,

        '--text-tertiary': eyebrowColor,

        '--radius-base': `${r}px`,
        '--radius-sm': `${Math.max(4, Math.round(r * 0.45))}px`,
        '--radius-md': `${Math.max(8, Math.round(r * 0.65))}px`,
        '--radius-lg': `${r}px`,
        '--radius-xl': `${Math.round(r * 1.35)}px`,

        '--accent': accentHex,
        '--accent-bright': mixWithWhite(a, 0.22),
        '--accent-glow': 'transparent',
        '--accent-subtle': rgba(a, 0.16),
        '--accent-border': rgba(a, 0.38),
        '--card-border-glow': 'transparent',
        '--btn-text': contrastText(a)
    };

    const canvas = {
        accent: accentHex,
        accentBright: css['--accent-bright'],
        accentTrail: rgba(a, 0.35),
        accentSheen: rgba(a, 0.04)
    };

    return { css, canvas };
}

export function useApexTheme() {
    const [themeState, setThemeState] = useState(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed.version === VERSION) {
                    return {
                        cardOpacity: Math.min(100, Math.max(15, Number(parsed.cardOpacity) || 78)),
                        eyebrowContrast: Math.min(100, Math.max(0, Number(parsed.eyebrowContrast) || 50)),
                        cornerRadius: Math.min(36, Math.max(6, Number(parsed.cornerRadius) || 18)),
                        autoAdapt: typeof parsed.autoAdapt === 'boolean' ? parsed.autoAdapt : true,
                        customAccent: parsed.customAccent || '#1550F0'
                    };
                }
            }
        } catch (e) { }
        return DEFAULT_THEME_STATE;
    });

    const tokens = deriveTokens(themeState);

    // Apply tokens directly to :root
    useEffect(() => {
        const root = document.documentElement;
        for (const [key, value] of Object.entries(tokens.css)) {
            root.style.setProperty(key, value);
        }
    }, [tokens]);

    // Persist to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: VERSION, ...themeState }));
        } catch (e) { }
    }, [themeState]);

    const updateTheme = useCallback((updates) => {
        setThemeState(prev => ({ ...prev, ...updates }));
    }, []);

    const resetTheme = useCallback(() => {
        setThemeState(DEFAULT_THEME_STATE);
    }, []);

    return {
        themeState,
        tokens,
        updateTheme,
        resetTheme
    };
}

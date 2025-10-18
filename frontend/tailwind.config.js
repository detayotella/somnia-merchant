/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./lib/**/*.{js,ts,jsx,tsx}"
    ],
    theme: {
        extend: {
            colors: {
                // Sophisticated monochromatic with luxury accents
                background: "#0B0F17",
                surface: "#131720",
                surfaceLight: "#1A1F2E",
                surfaceHover: "#232938",

                // Elegant gold/bronze accent system
                primary: "#D4AF37",      // Rich Gold
                primaryLight: "#E8C96F",
                primaryDark: "#B8941F",

                secondary: "#CD7F32",    // Bronze
                secondaryLight: "#E09B5C",

                accent: "#FFD700",       // Bright Gold for highlights
                accentLight: "#FFE44D",

                // Status colors (muted, professional)
                warning: "#D97706",
                success: "#059669",
                error: "#DC2626",

                // Text colors
                textPrimary: "#FFFFFF",
                textSecondary: "#E2E8F0",
                textMuted: "#94A3B8",
                textDisabled: "#64748B",

                // Borders
                border: "#1E293B",
                borderLight: "#334155",
                borderAccent: "#D4AF37"
            },
            fontFamily: {
                sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
                display: ["var(--font-display)", "Space Grotesk", "sans-serif"],
                mono: ["JetBrains Mono", "Courier New", "monospace"]
            },
            boxShadow: {
                glow: "0 0 80px -20px rgba(212, 175, 55, 0.3)",
                glowStrong: "0 0 100px -15px rgba(212, 175, 55, 0.5)",
                card: "0 4px 24px -4px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(212, 175, 55, 0.1)",
                cardHover: "0 20px 60px -10px rgba(212, 175, 55, 0.2), 0 0 0 1px rgba(212, 175, 55, 0.3)",
                inner: "inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)",
                luxury: "0 8px 32px -8px rgba(212, 175, 55, 0.25), 0 0 0 1px rgba(212, 175, 55, 0.15)"
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-luxury': 'linear-gradient(135deg, #D4AF37 0%, #FFD700 50%, #D4AF37 100%)',
                'gradient-subtle': 'linear-gradient(180deg, rgba(212, 175, 55, 0.05) 0%, transparent 100%)',
                'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E\")"
            },
            animation: {
                'shimmer': 'shimmer 3s ease-in-out infinite',
                'float': 'float 8s ease-in-out infinite',
                'pulse-subtle': 'pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                'slide-up': 'slideUp 0.6s ease-out',
                'fade-in': 'fadeIn 0.8s ease-out',
                'scale-in': 'scaleIn 0.5s ease-out',
                'border-beam': 'border-beam 2s linear infinite'
            },
            keyframes: {
                shimmer: {
                    '0%, 100%': { backgroundPosition: '0% 50%' },
                    '50%': { backgroundPosition: '100% 50%' }
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
                    '33%': { transform: 'translateY(-15px) rotate(2deg)' },
                    '66%': { transform: 'translateY(-8px) rotate(-2deg)' }
                },
                'pulse-subtle': {
                    '0%, 100%': { opacity: '1' },
                    '50%': { opacity: '0.6' }
                },
                slideUp: {
                    '0%': { transform: 'translateY(30px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' }
                },
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' }
                },
                scaleIn: {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' }
                },
                'border-beam': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(100%)' }
                }
            },
            backdropBlur: {
                xs: '2px'
            }
        }
    },
    plugins: []
};

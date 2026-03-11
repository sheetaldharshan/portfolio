import type { Config } from "tailwindcss";

const svgToDataUri = require("mini-svg-data-uri");
const { default: flattenColorPalette } = require("tailwindcss/lib/util/flattenColorPalette");

const config: Config = {
	darkMode: ["class"],
	content: [
		"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/components/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/app/**/*.{js,ts,jsx,tsx,mdx}",
		"./src/data/**/*.{ts,tsx}",
	],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: [
					'var(--font-inter)',
					'sans-serif'
				],
				display: [
					'var(--font-space)',
					'sans-serif'
				],
				mono: [
					'var(--font-jetbrains)',
					'monospace'
				],
				signature: [
					'var(--font-signature)',
					'cursive'
				],
				modern: [
					'var(--font-modern)',
					'sans-serif'
				],
				elnath: [
					'var(--font-elnath)',
					'sans-serif'
				],
				pavelt: [
					'var(--font-pavelt)',
					'cursive'
				]
			},
			colors: {
				background: 'hsl(var(--background))',
				surface: '#18181b',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				gold: '#eab308',
				text: {
					main: '#f8fafc',
					muted: '#94a3b8'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				foreground: 'hsl(var(--foreground))',
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				spotlight: {
					'0%': {
						opacity: '0',
						transform: 'translate(-72%, -62%) scale(0.5)'
					},
					'100%': {
						opacity: '1',
						transform: 'translate(-50%,-40%) scale(1)'
					}
				},
				shimmer: {
					from: {
						backgroundPosition: '0 0'
					},
					to: {
						backgroundPosition: '-200% 0'
					}
				},
				moveHorizontal: {
					'0%': {
						transform: 'translateX(-50%) translateY(-10%)'
					},
					'50%': {
						transform: 'translateX(50%) translateY(10%)'
					},
					'100%': {
						transform: 'translateX(-50%) translateY(-10%)'
					}
				},
				moveInCircle: {
					'0%': {
						transform: 'rotate(0deg)'
					},
					'50%': {
						transform: 'rotate(180deg)'
					},
					'100%': {
						transform: 'rotate(360deg)'
					}
				},
				moveVertical: {
					'0%': {
						transform: 'translateY(-50%)'
					},
					'50%': {
						transform: 'translateY(50%)'
					},
					'100%': {
						transform: 'translateY(-50%)'
					}
				},
				scroll: {
					to: {
						transform: 'translate(calc(-50% - 0.5rem))'
					}
				},
				float: {
					'0%, 100%': {
						transform: 'translateY(0px)'
					},
					'50%': {
						transform: 'translateY(-20px)'
					}
				},
				'pulse-glow': {
					'0%, 100%': {
						boxShadow: '0 0 20px rgba(124, 58, 237, 0.3)'
					},
					'50%': {
						boxShadow: '0 0 40px rgba(124, 58, 237, 0.6)'
					}
				},
				'typing-dot': {
					'0%, 60%, 100%': {
						transform: 'translateY(0)'
					},
					'30%': {
						transform: 'translateY(-8px)'
					}
				},
				ripple: {
					'0%, 100%': {
						transform: 'translate(-50%, -50%) scale(1)',
						opacity: '1'
					},
					'50%': {
						transform: 'translate(-50%, -50%) scale(1.8)',
						opacity: '0'
					}
				}
			},
			animation: {
				spotlight: 'spotlight 2s ease .75s 1 forwards',
				shimmer: 'shimmer 2s linear infinite',
				'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				first: 'moveVertical 30s ease infinite',
				second: 'moveInCircle 20s reverse infinite',
				third: 'moveInCircle 40s linear infinite',
				fourth: 'moveHorizontal 40s ease infinite',
				fifth: 'moveInCircle 20s ease infinite',
				scroll: 'scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite',
				float: 'float 6s ease-in-out infinite',
				'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
				'typing-1': 'typing-dot 1.4s ease-in-out infinite',
				'typing-2': 'typing-dot 1.4s ease-in-out 0.2s infinite',
				'typing-3': 'typing-dot 1.4s ease-in-out 0.4s infinite',
				ripple: 'ripple 3.5s ease-in-out infinite'
			}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		addVariablesForColors,
		function ({ matchUtilities, theme }: any) {
			matchUtilities(
				{
					"bg-grid": (value: any) => ({
						backgroundImage: `url("${svgToDataUri(
							`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="100" height="100" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
						)}")`,
					}),
					"bg-grid-small": (value: any) => ({
						backgroundImage: `url("${svgToDataUri(
							`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="8" height="8" fill="none" stroke="${value}"><path d="M0 .5H31.5V32"/></svg>`
						)}")`,
					}),
					"bg-dot": (value: any) => ({
						backgroundImage: `url("${svgToDataUri(
							`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="16" height="16" fill="none"><circle fill="${value}" cx="10" cy="10" r="1.6257413380501518"></circle></svg>`
						)}")`,
					}),
				},
				{ values: flattenColorPalette(theme("backgroundColor")), type: "color" }
			);
		},
	],
};

function addVariablesForColors({ addBase, theme }: any) {
	let allColors = flattenColorPalette(theme("colors"));
	let newVars = Object.fromEntries(
		Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
	);
	addBase({ ":root": newVars });
}

export default config;

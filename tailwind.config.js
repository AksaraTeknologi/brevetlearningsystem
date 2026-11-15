import defaultTheme from 'tailwindcss/defaultTheme';
import colors from 'tailwindcss/colors';
import forms from '@tailwindcss/forms';

/*
 * Palet Brevet Learning System (Emerald Forest + Warm Amber Gold, netral slate).
 * Menyelaraskan identitas hijau emerald BLS (#0D4D40 / #0F6B59 / #16A382)
 * dengan aksen emas hangat (#F7B519) pada arsitektur token semantik modern.
 * Kode lama yang memakai gray/zinc diarahkan ke slate, dan biru tua/navy
 * dipetakan ke skala emerald brand agar tetap serasi di seluruh halaman.
 */
const brand = {
    50: '#EEFBF7',
    100: '#D4F5EA',
    200: '#A9EAD6',
    300: '#72D9BC',
    400: '#3BBF9D',
    500: '#16A382',
    600: '#0F8268',
    700: '#0E6B56',
    800: '#0C5646',
    900: '#0D4D40',
    950: '#073129',
};

/** @type {import('tailwindcss').Config} */
export default {
    /*
     * Mode gelap: class `dark` di <html>. Elemen di dalam `.light` dipaksa terang
     * (untuk halaman yang belum mendukung mode gelap).
     */
    darkMode: ['variant', '&:not(.light *):is(.dark *)'],
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
    ],

    theme: {
    	extend: {
    		fontFamily: {
    			sans: [
    				'Manrope',
                    ...defaultTheme.fontFamily.sans
                ],
    			heading: [
    				'Manrope',
                    ...defaultTheme.fontFamily.sans
                ]
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		colors: {
    			gray: colors.slate,
    			zinc: colors.slate,
    			navy: brand,
    			blue: {
    				...colors.blue,
    				900: brand[800],
    				950: brand[900]
    			},
    			yellow: {
    				...colors.yellow,
    				/* "kuning" lama = sorotan lime BLS */
    				400: '#C5F24A',
    				500: '#B4E033'
    			},
    			/* Digelapkan agar teks/tombol lolos kontras WCAG 4.5:1 */
    			red: {
    				...colors.red,
    				500: '#DC2626',
    				600: '#C81E1E'
    			},
    			green: {
    				...colors.green,
    				600: '#15803D',
    				700: '#166534'
    			},
    			highlight: {
    				DEFAULT: 'hsl(var(--highlight))',
    				foreground: 'hsl(var(--highlight-foreground))',
    				soft: 'hsl(var(--highlight-soft))'
    			},
    			brand: {
    				...brand,
    				DEFAULT: 'hsl(var(--brand))',
    				foreground: 'hsl(var(--brand-foreground))',
    				ink: 'hsl(var(--brand-ink))'
    			},
    			steel: {
    				DEFAULT: 'hsl(var(--steel))',
    				foreground: 'hsl(var(--steel-foreground))'
    			},
    			/* Latar halaman di balik kartu (mint-slate lembut / obsidian emerald di mode gelap) */
    			page: 'hsl(var(--page))',
    			success: {
    				DEFAULT: 'hsl(var(--success))',
    				foreground: 'hsl(var(--success-foreground))'
    			},
    			warning: {
    				DEFAULT: 'hsl(var(--warning))',
    				foreground: 'hsl(var(--warning-foreground))'
    			},
    			info: {
    				DEFAULT: 'hsl(var(--info))',
    				foreground: 'hsl(var(--info-foreground))'
    			},
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			},
    			sidebar: {
    				DEFAULT: 'hsl(var(--sidebar-background))',
    				foreground: 'hsl(var(--sidebar-foreground))',
    				primary: 'hsl(var(--sidebar-primary))',
    				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
    				accent: 'hsl(var(--sidebar-accent))',
    				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
    				border: 'hsl(var(--sidebar-border))',
    				ring: 'hsl(var(--sidebar-ring))'
    			}
    		},
    		keyframes: {
    			'accordion-down': {
    				from: {
    					height: '0'
    				},
    				to: {
    					height: 'var(--radix-accordion-content-height)'
    				}
    			},
    			'accordion-up': {
    				from: {
    					height: 'var(--radix-accordion-content-height)'
    				},
    				to: {
    					height: '0'
    				}
    			}
    		},
    		animation: {
    			'accordion-down': 'accordion-down 0.2s ease-out',
    			'accordion-up': 'accordion-up 0.2s ease-out'
    		}
    	}
    },

    plugins: [forms, require("tailwindcss-animate")],
};

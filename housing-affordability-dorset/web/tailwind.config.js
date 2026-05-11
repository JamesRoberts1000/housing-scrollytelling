/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				ink: '#1c1c1c',
				paper: '#f6f4f0',
				muted: '#5c5c5c',
				accent: '#2a4f6f',
				line: '#d9d4cc'
			},
			fontFamily: {
				sans: ['system-ui', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
				serif: ['Georgia', 'Times New Roman', 'serif']
			}
		}
	},
	plugins: []
};

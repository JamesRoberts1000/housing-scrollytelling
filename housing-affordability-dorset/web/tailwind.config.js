/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// Aligned with GOV.UK / ONS-style neutrals (no proprietary GDS Transport font)
				ink: '#222222',
				paper: '#ffffff',
				muted: '#222222',
				accent: '#206095',
				line: '#b1b4b6'
			},
			fontFamily: {
				sans: ['Open Sans', 'Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif']
			}
		}
	},
	plugins: []
};

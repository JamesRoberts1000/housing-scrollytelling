/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// Aligned with GOV.UK / ONS-style neutrals (Arial stack; no proprietary GDS Transport font)
				ink: '#0b0c0c',
				paper: '#ffffff',
				muted: '#505a5f',
				accent: '#1d70b8',
				line: '#b1b4b6'
			},
			fontFamily: {
				// ONS public pages typically use Arial-based sans-serif (similar to GOV.UK body text)
				sans: ['Arial', 'Helvetica', 'Helvetica Neue', 'sans-serif']
			}
		}
	},
	plugins: []
};

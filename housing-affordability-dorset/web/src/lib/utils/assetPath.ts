import { base } from '$app/paths';

/** Resolve a path to a static asset, respecting the SvelteKit base path (GitHub Pages). */
export function assetPath(path: string): string {
	return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

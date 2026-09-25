/**
 * Shared production site configuration and canonical URLs.
 * Current production domain: novaxhub.vercel.app
 */

export const SITE_DOMAIN = 'novaxhub.vercel.app';
export const SITE_URL = `https://${SITE_DOMAIN}`;

export const LOADER_URL = `${SITE_URL}/loader`;
export const LOADER_SNIPPET = `loadstring(game:HttpGet("${LOADER_URL}"))()`;

export function getRawScriptUrl(slug: string): string {
  return `${SITE_URL}/raw/${slug}`;
}

export function getScriptExecutionUrl(): string {
  return `${SITE_URL}/api/executions`;
}

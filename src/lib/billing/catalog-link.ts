/** DEFERRED (Kevin 2026-09-05): no website catalog CTAs in SoftPaywall for now. Kept for possible later use. Never sells peptides in-app. */
/**
 * Website deep-link helper for the research catalog (220bioworx.com).
 * NEVER open in-app peptide checkout — commerce stays on the website.
 */

export const BIOWORX_SITE_ORIGIN = 'https://220bioworx.com';

/** Default catalog URL (site root until a dedicated research path is confirmed). */
export const RESEARCH_CATALOG_URL = BIOWORX_SITE_ORIGIN;

export type CatalogLinkContext =
  | 'browse_catalog'
  | 'low_inventory'
  | 'education'
  | 'paywall';

/**
 * Build a website URL for catalog / education CTAs.
 * Optional path must be relative (no scheme) — defaults to site root.
 */
export function getResearchCatalogUrl(
  context: CatalogLinkContext = 'browse_catalog',
  path = '',
): string {
  const base = BIOWORX_SITE_ORIGIN.replace(/\/$/, '');
  const normalized = path.startsWith('/') ? path : path ? `/${path}` : '';
  const url = new URL(`${base}${normalized || '/'}`);
  url.searchParams.set('utm_source', 'pins_app');
  url.searchParams.set('utm_medium', 'app');
  url.searchParams.set('utm_campaign', context);
  return url.toString();
}

/** Open research catalog in the system browser. Never performs in-app checkout. */
export function openResearchCatalog(context: CatalogLinkContext = 'browse_catalog'): void {
  const href = getResearchCatalogUrl(context);
  try {
    window.open(href, '_blank', 'noopener,noreferrer');
  } catch (err) {
    console.warn('[billing] Failed to open catalog link', err);
  }
}

/**
 * Dynamic URL utility for MeetingNext
 * Generates publicly accessible meeting links for customers and team members.
 * 
 * Note: Google Cloud Run AI Studio preview URLs (*.run.app) are private developer
 * sandboxes protected by Google authentication (applet-auth-bridge). If external
 * users, customers, or secondary devices click an ais-dev-*.run.app link, Google
 * returns a "403 That's an error - You do not have access to this page" error.
 * 
 * Therefore, shareable meeting links always resolve to the public production domain
 * (https://meetingnext-eta.vercel.app) or real public custom origins.
 */

export function getAppBaseUrl(): string {
  // 1. Explicit public APP_URL
  const envAppUrl = typeof process !== 'undefined' ? process.env?.APP_URL : undefined;
  if (
    envAppUrl &&
    !envAppUrl.includes('.run.app') &&
    !envAppUrl.includes('aistudio') &&
    envAppUrl.trim() !== ''
  ) {
    return envAppUrl.replace(/\/$/, '');
  }

  // 2. Vercel deployment variables
  if (typeof process !== 'undefined') {
    if (process.env?.VERCEL_PROJECT_PRODUCTION_URL) {
      return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL.replace(/\/$/, '')}`;
    }
    if (process.env?.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL.replace(/\/$/, '')}`;
    }
  }

  // 3. Browser runtime: dynamically use current window origin
  if (typeof window !== 'undefined' && window.location?.origin) {
    const hostname = window.location.hostname;
    // In AI Studio internal dev container (ais-dev-*), convert to public shared preview (ais-pre-*)
    // so external devices/participants can join directly without Google 403 applet-auth-bridge error
    if (hostname.startsWith('ais-dev-')) {
      return window.location.origin.replace('ais-dev-', 'ais-pre-');
    }
    // Localhost, Vercel, or custom domains: return the exact working origin
    if (hostname !== '') {
      return window.location.origin;
    }
  }

  return '';
}

/**
 * Generates a public, clickable meeting room URL that opens without authentication barriers
 */
export function generateMeetingLink(roomId: string): string {
  const base = getAppBaseUrl();
  const cleanId = roomId.replace(/^https?:\/\/[^\/]+\/(room\/)?/, '').replace(/^\/+/, '');
  const finalRoomId = cleanId.startsWith('room/') ? cleanId.substring(5) : cleanId;
  return base ? `${base}/room/${finalRoomId}` : `/room/${finalRoomId}`;
}

export const DEFAULT_SECURITY_HEADERS: Record<string, string> = {
  // Basic hardening
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',

  // Reasonable referrer control
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Lightweight CSP (API-friendly, ama aşırı sert değil)
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none';",

  // Modern isolation (safe default)
  'Cross-Origin-Opener-Policy': 'same-origin',

  // Conservative caching (API için güvenli ama override edilebilir)
  'Cache-Control': 'no-store',

  // Legacy cache fallback
  'Pragma': 'no-cache',

  // Small extra hardening
  'X-DNS-Prefetch-Control': 'off',
};
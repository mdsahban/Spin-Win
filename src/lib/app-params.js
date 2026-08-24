// Standalone app params — no longer depends on Base44.
// The only param we need from the URL is `access_token` for Supabase
// OAuth deep-links (e.g. password-reset emails). Everything else comes
// from VITE_* environment variables.

export const appParams = {
  apiBase: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
};

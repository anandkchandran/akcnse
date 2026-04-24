/**
 * Shared API base URL.
 *
 * Priority order:
 *   1. VITE_API_URL build-time env var (set via GitHub secret)
 *   2. Running on localhost → local dev server
 *   3. Running anywhere else (GH Pages, etc.) → Render backend
 *
 * This means the app works out-of-the-box on GH Pages even if the
 * VITE_API_URL secret was never added to the repo.
 */
export const API_BASE =
  import.meta.env.VITE_API_URL ||
  (typeof location !== 'undefined' && location.hostname !== 'localhost'
    ? 'https://akcnse.onrender.com'
    : 'http://localhost:4001');

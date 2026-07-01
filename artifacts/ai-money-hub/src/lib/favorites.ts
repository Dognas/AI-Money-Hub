const FAVS_KEY = "amh_favorites";
const RECENT_KEY = "amh_recent";

export function getFavorites(): string[] {
  try { return JSON.parse(localStorage.getItem(FAVS_KEY) || "[]"); } catch { return []; }
}

export function toggleFavorite(id: string): boolean {
  const favs = getFavorites();
  const idx = favs.indexOf(id);
  if (idx >= 0) { favs.splice(idx, 1); } else { favs.unshift(id); }
  try { localStorage.setItem(FAVS_KEY, JSON.stringify(favs.slice(0, 20))); } catch {}
  return idx < 0;
}

export function isFavorite(id: string): boolean {
  return getFavorites().includes(id);
}

export function trackRecent(id: string) {
  try {
    const recent: string[] = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    const filtered = recent.filter(r => r !== id);
    filtered.unshift(id);
    localStorage.setItem(RECENT_KEY, JSON.stringify(filtered.slice(0, 10)));
  } catch {}
}

export function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}

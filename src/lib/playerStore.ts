export interface PlayerSession {
  id: string;
  name: string;
}

const KEY = "player_session";

export function getPlayer(): PlayerSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setPlayer(player: PlayerSession) {
  localStorage.setItem(KEY, JSON.stringify(player));
}

export function clearPlayer() {
  localStorage.removeItem(KEY);
}

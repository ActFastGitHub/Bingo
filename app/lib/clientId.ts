export function getClientId(): string {
  if (typeof window === "undefined") return "";
  const key = "bingo_client_id";
  let id = localStorage.getItem(key);
  if (id) return id;
  id = "c_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  localStorage.setItem(key, id);
  return id;
}

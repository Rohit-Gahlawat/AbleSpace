const listeners = new Set<() => void>();

export function subscribeToStorage(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

export function readStored(key: string) {
  return localStorage.getItem(key);
}

export function writeStored(key: string, value: string) {
  localStorage.setItem(key, value);
  for (const listener of listeners) listener();
}

export function removeStored(key: string) {
  localStorage.removeItem(key);
  for (const listener of listeners) listener();
}

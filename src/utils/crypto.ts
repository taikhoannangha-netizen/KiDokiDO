const SECRET_KEY = "KIDO_ENGLISH_SECURE_KEY_2026";

export function encryptData<T = any>(data: T): string {
  try {
    const json = JSON.stringify(data);
    const textBytes = new TextEncoder().encode(json);
    const keyBytes = new TextEncoder().encode(SECRET_KEY);
    const resultBytes = new Uint8Array(textBytes.length);
    for (let i = 0; i < textBytes.length; i++) {
      resultBytes[i] = textBytes[i] ^ keyBytes[i % keyBytes.length];
    }
    let binary = '';
    for (let i = 0; i < resultBytes.length; i++) {
      binary += String.fromCharCode(resultBytes[i]);
    }
    return btoa(binary);
  } catch (e) {
    console.error('Encryption error:', e);
    return JSON.stringify(data);
  }
}

export function decryptData<T = any>(cipherText: string | null | undefined, fallback: T): T {
  try {
    if (!cipherText) return fallback;
    try {
      const binary = atob(cipherText);
      const cipherBytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        cipherBytes[i] = binary.charCodeAt(i);
      }
      const keyBytes = new TextEncoder().encode(SECRET_KEY);
      const plainBytes = new Uint8Array(cipherBytes.length);
      for (let i = 0; i < cipherBytes.length; i++) {
        plainBytes[i] = cipherBytes[i] ^ keyBytes[i % keyBytes.length];
      }
      const decoded = new TextDecoder().decode(plainBytes);
      const parsed = JSON.parse(decoded);
      if (parsed) return parsed as T;
    } catch {}

    try {
      return JSON.parse(cipherText) as T;
    } catch {
      return fallback;
    }
  } catch {
    return fallback;
  }
}

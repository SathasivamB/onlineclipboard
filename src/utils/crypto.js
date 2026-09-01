export async function generateKeyString() {
  // Generate a random 6-digit PIN string (e.g. "482910")
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  return pin;
}

async function deriveKeyFromPin(pinStr) {
  const enc = new TextEncoder();
  // Hash the PIN with SHA-256 to get a secure 256-bit AES key
  const hash = await window.crypto.subtle.digest('SHA-256', enc.encode(pinStr));
  return await window.crypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptData(arrayBuffer, pinStr) {
  const key = await deriveKeyFromPin(pinStr);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    arrayBuffer
  );

  const combined = new Uint8Array(12 + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), 12);
  return combined.buffer;
}

export async function decryptData(arrayBuffer, pinStr) {
  const key = await deriveKeyFromPin(pinStr);
  const combined = new Uint8Array(arrayBuffer);
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);

  return await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
}

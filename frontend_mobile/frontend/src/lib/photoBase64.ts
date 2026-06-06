function stripDataUri(value: string) {
  const commaIndex = value.indexOf(",");
  if (value.startsWith("data:") && commaIndex >= 0) {
    return value.slice(commaIndex + 1);
  }
  return value;
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return globalThis.btoa(binary);
}

async function localUriToBase64(uri: string) {
  const response = await fetch(uri);
  if (!response.ok) {
    throw new Error("Unable to read captured photo.");
  }
  const buffer = await response.arrayBuffer();
  return bytesToBase64(new Uint8Array(buffer));
}

function isLocalUri(value: string) {
  return /^(file|content|ph):\/\//i.test(value);
}

/** Normalize camera/file output into raw Base64 for `/orders/{id}/capture-photo`. */
export async function preparePhotoBase64(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error("Photo data is empty.");
  }

  if (trimmed.startsWith("data:")) {
    return stripDataUri(trimmed);
  }

  if (isLocalUri(trimmed)) {
    return localUriToBase64(trimmed);
  }

  return trimmed;
}

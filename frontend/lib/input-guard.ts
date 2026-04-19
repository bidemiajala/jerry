// Prompt injection indicators — patterns that attempt to hijack system instructions
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions?/i,
  /disregard\s+(your|all|the)\s+(previous\s+)?instructions?/i,
  /you\s+are\s+now\s+(a|an|the)\s/i,
  /new\s+instructions?\s*:/i,
  /override\s+(your\s+)?(previous\s+)?instructions?/i,
  /forget\s+(everything|all|your|the\s+previous)/i,
  /system\s+prompt/i,
  /\bJAILBREAK\b/i,
  // Prompt delimiter injection
  /<\/?(?:system|user|assistant|instructions?)>/i,
  /\[INST\]|\[\/INST\]/i,
  // Repetitive junk (spam / token flooding)
  /(.)\1{200,}/,
]

type GuardResult<T = string> =
  | { ok: true; value: T }
  | { ok: false; error: string; status: 400 | 422 }

export function guardText(raw: unknown, maxLength: number): GuardResult {
  if (typeof raw !== 'string') {
    return { ok: false, error: 'Field must be a string', status: 400 }
  }

  // Strip null bytes
  const value = raw.replace(/\0/g, '').trim()

  if (value.length > maxLength) {
    return {
      ok: false,
      error: `Input too long (max ${maxLength} characters, got ${raw.length})`,
      status: 422,
    }
  }

  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(value)) {
      return { ok: false, error: 'Input contains disallowed content', status: 422 }
    }
  }

  return { ok: true, value }
}

// Private/internal IP ranges — blocked to prevent SSRF
const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,         // 127.0.0.0/8
  /^10\.\d+\.\d+\.\d+$/,          // 10.0.0.0/8
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/, // 172.16.0.0/12
  /^192\.168\.\d+\.\d+$/,         // 192.168.0.0/16
  /^169\.254\.\d+\.\d+$/,         // link-local
  /^0\.0\.0\.0$/,
  /^::1$/,                         // IPv6 loopback
  /^fc00:/i,                       // IPv6 unique local
  /^fe80:/i,                       // IPv6 link-local
  /\.internal$/i,                  // GCP/AWS internal hostnames
  /\.local$/i,
]

export function guardUrl(raw: unknown): GuardResult<URL> {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { ok: false, error: 'url is required', status: 400 }
  }

  let parsed: URL
  try {
    parsed = new URL(raw.trim())
  } catch {
    return { ok: false, error: 'Invalid URL', status: 422 }
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, error: 'URL must use http or https', status: 422 }
  }

  const hostname = parsed.hostname
  for (const pattern of PRIVATE_HOST_PATTERNS) {
    if (pattern.test(hostname)) {
      return {
        ok: false,
        error: 'URLs pointing to private or internal addresses are not allowed',
        status: 422,
      }
    }
  }

  return { ok: true, value: parsed }
}

export function guardEnum<T extends string>(
  raw: unknown,
  allowed: readonly T[],
  fallback: T
): T {
  return (allowed as readonly unknown[]).includes(raw) ? (raw as T) : fallback
}

// @ts-nocheck

const BASE_URL = 'https://openapi.jayapayment.com'

// ── Helper functions ──
function base64Clean(b64) {
  return b64
    .replace(/-----BEGIN[\s\S]*?-----/g, '')
    .replace(/-----END[\s\S]*?-----/g, '')
    .replace(/\s/g, '')
}

function b64ToBytes(b64) {
  const bin = atob(base64Clean(b64))
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function bytesToB64(bytes) {
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}

function derReadLen(buf, off) {
  if (buf[off] < 0x80) return { len: buf[off], next: off + 1 }
  const n = buf[off] & 0x7f
  let len = 0
  for (let i = 0; i < n; i++) len = (len << 8) | buf[off + 1 + i]
  return { len, next: off + 1 + n }
}

function derReadInt(buf, off) {
  if (buf[off] !== 0x02) throw new Error('Expected INTEGER at ' + off)
  const { len, next } = derReadLen(buf, off + 1)
  let start = next, l = len
  if (buf[start] === 0x00) { start++; l-- }
  let n = 0n
  for (let i = 0; i < l; i++) n = (n << 8n) | BigInt(buf[start + i])
  return { val: n, next: next + len }
}

function parsePKCS8(bytes) {
  let off = 0
  if (bytes[off++] !== 0x30) throw new Error('Expected SEQUENCE')
  let r = derReadLen(bytes, off); off = r.next
  if (bytes[off] !== 0x02) throw new Error('Expected version')
  r = derReadLen(bytes, off + 1); off = r.next + r.len
  if (bytes[off] !== 0x30) throw new Error('Expected AlgorithmIdentifier')
  r = derReadLen(bytes, off + 1); off = r.next + r.len
  if (bytes[off++] !== 0x04) throw new Error('Expected OCTET STRING')
  r = derReadLen(bytes, off); off = r.next
  if (bytes[off++] !== 0x30) throw new Error('Expected inner SEQUENCE')
  r = derReadLen(bytes, off); off = r.next
  let res = derReadInt(bytes, off); off = res.next
  res = derReadInt(bytes, off); const n = res.val; off = res.next
  res = derReadInt(bytes, off); const e = res.val; off = res.next
  res = derReadInt(bytes, off); const d = res.val; off = res.next
  res = derReadInt(bytes, off); const p = res.val; off = res.next
  res = derReadInt(bytes, off); const q = res.val; off = res.next
  res = derReadInt(bytes, off); const dp = res.val; off = res.next
  res = derReadInt(bytes, off); const dq = res.val; off = res.next
  res = derReadInt(bytes, off); const qi = res.val
  return { n, e, d, p, q, dp, dq, qi }
}

function parsePKCS1(bytes) {
  let off = 0
  if (bytes[off++] !== 0x30) throw new Error('Expected SEQUENCE')
  const r = derReadLen(bytes, off); off = r.next
  let res = derReadInt(bytes, off); off = res.next
  res = derReadInt(bytes, off); const n = res.val; off = res.next
  res = derReadInt(bytes, off); const e = res.val; off = res.next
  res = derReadInt(bytes, off); const d = res.val; off = res.next
  res = derReadInt(bytes, off); const p = res.val; off = res.next
  res = derReadInt(bytes, off); const q = res.val; off = res.next
  res = derReadInt(bytes, off); const dp = res.val; off = res.next
  res = derReadInt(bytes, off); const dq = res.val; off = res.next
  res = derReadInt(bytes, off); const qi = res.val
  return { n, e, d, p, q, dp, dq, qi }
}

function parsePrivateKey(b64Key) {
  const bytes = b64ToBytes(b64Key)
  if (b64Key.includes('BEGIN RSA PRIVATE KEY')) return parsePKCS1(bytes)
  if (b64Key.includes('BEGIN PRIVATE KEY')) return parsePKCS8(bytes)
  try { return parsePKCS8(bytes) } catch {}
  try { return parsePKCS1(bytes) } catch {}
  throw new Error('Cannot parse private key')
}

function modpow(base, exp, mod) {
  let result = 1n
  base = base % mod
  while (exp > 0n) {
    if (exp % 2n === 1n) result = result * base % mod
    exp = exp / 2n
    base = base * base % mod
  }
  return result
}

function bigIntToBytes(n, len) {
  const arr = new Uint8Array(len)
  let tmp = n
  for (let i = len - 1; i >= 0; i--) {
    arr[i] = Number(tmp & 0xffn)
    tmp >>= 8n
  }
  return arr
}

function bytesToBigInt(bytes) {
  let n = 0n
  for (const b of bytes) n = (n << 8n) | BigInt(b)
  return n
}

function keySize(n) {
  let bits = 0, tmp = n
  while (tmp > 0n) { bits++; tmp >>= 1n }
  return Math.ceil(bits / 8)
}

function pkcs1v15EncryptChunk(chunk, key) {
  const { n, d } = key
  const k = keySize(n)
  const mLen = chunk.length
  if (mLen > k - 11) throw new Error('Chunk too long')
  const psLen = k - mLen - 3
  const em = new Uint8Array(k)
  em[0] = 0x00; em[1] = 0x01
  for (let i = 0; i < psLen; i++) em[2 + i] = 0xff
  em[2 + psLen] = 0x00
  em.set(chunk, 3 + psLen)
  const m = bytesToBigInt(em)
  const c = modpow(m, d, n)
  return bigIntToBytes(c, k)
}

function pkcs1v15Sign(dataBytes, key) {
  const chunkSize = 117
  const chunks = []
  for (let i = 0; i < dataBytes.length; i += chunkSize) {
    chunks.push(dataBytes.slice(i, i + chunkSize))
  }
  const parts = chunks.map(chunk => pkcs1v15EncryptChunk(chunk, key))
  const totalLen = parts.reduce((s, p) => s + p.length, 0)
  const result = new Uint8Array(totalLen)
  let offset = 0
  for (const p of parts) { result.set(p, offset); offset += p.length }
  return result
}

async function rsaSign(data, base64PrivateKey) {
  const key = parsePrivateKey(base64PrivateKey)
  const encoder = new TextEncoder()
  const dataBytes = encoder.encode(data)
  const encrypted = pkcs1v15Sign(dataBytes, key)
  return bytesToB64(encrypted)
}

async function rsaVerify(data, base64Signature, base64PublicKey) {
  try {
    const binaryDer = b64ToBytes(base64PublicKey).buffer
    const key = await crypto.subtle.importKey(
      'spki', binaryDer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false, ['verify']
    )
    const encoder = new TextEncoder()
    const sigBytes = b64ToBytes(base64Signature).buffer
    return await crypto.subtle.verify(
      { name: 'RSASSA-PKCS1-v1_5' }, key, sigBytes, encoder.encode(data)
    )
  } catch { return false }
}

function buildSignString(params) {
  const sortedKeys = Object.keys(params).sort()
  return sortedKeys.map(k => String(params[k])).join('')
}

function dateTime() {
  const now = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`
}

// ── Public API ──

export async function createOrder(params) {
  const {
    merchantCode, privateKey, mode,
    orderNum, amount, method,
    name, email, phone,
    notifyUrl, productDetail,
  } = params

  const reqParams = {
    merchantCode,
    orderType: '0',
    orderNum: String(orderNum),
    payMoney: String(Math.round(amount)),
    name: name || 'User',
    email: email || 'user@indonetwork.com',
    phone: String(phone || '081234567890'),
    productDetail: productDetail || 'Deposit INDONETWORK',
    notifyUrl,
    dateTime: dateTime(),
    expiryPeriod: '60',
  }

  if (method) reqParams.method = method

  const signStr = buildSignString(reqParams)
  const sign = await rsaSign(signStr, privateKey)
  reqParams.sign = sign

  const url = mode === 'live'
    ? `${BASE_URL}/gateway/prepaidOrder`
    : `${BASE_URL}/gateway/prepaidOrder` // JayaPay pakai URL sama untuk test

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqParams),
  })

  return res.json()
}

export async function verifyCallback(payload, publicKey) {
  try {
    if (!publicKey || publicKey.length < 10) return true // skip jika key kosong
    const { platSign, ...rest } = payload
    if (!platSign) return true
    const signStr = buildSignString(rest)
    return await rsaVerify(signStr, platSign, publicKey)
  } catch { return false }
}

export function parseCallbackStatus(payload) {
  const s = String(payload.status || '')
  const code = String(payload.code || '')
  if (s === 'SUCCESS' || code === '00') return 'paid'
  if (s === 'FAILED' || s === 'PAY_ERROR') return 'failed'
  if (payload.platRespCode === 'SUCCESS') return 'paid'
  return 'pending'
}

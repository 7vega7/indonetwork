// @ts-nocheck

const JAYAPAY_URL_LIVE = 'https://openapi.jayapayment.com/gateway/prepaidOrder'
const JAYAPAY_URL_TEST = 'https://sandbox.jayapayment.com/gateway/prepaidOrder'

// Import RSA key dari PEM/Base64
async function importPrivateKey(base64Key: string) {
  const binaryKey = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0))
  return crypto.subtle.importKey(
    'pkcs8', binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-1' },
    false, ['sign']
  )
}

async function importPublicKey(base64Key: string) {
  const binaryKey = Uint8Array.from(atob(base64Key), c => c.charCodeAt(0))
  return crypto.subtle.importKey(
    'spki', binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-1' },
    false, ['verify']
  )
}

// Generate signature - sort params by key, concat values, sign with RSA
export async function generateSign(params: Record<string, string>, privateKeyBase64: string): Promise<string> {
  const sorted = Object.keys(params).sort().reduce((acc, key) => {
    if (key !== 'sign' && params[key]) acc[key] = params[key]
    return acc
  }, {} as Record<string, string>)

  const str = Object.values(sorted).join('')
  const key = await importPrivateKey(privateKeyBase64)
  const enc = new TextEncoder()
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, enc.encode(str))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

// Verify signature dari callback
export async function verifySign(params: Record<string, any>, publicKeyBase64: string): Promise<boolean> {
  try {
    const { platSign, ...rest } = params
    const sorted = Object.keys(rest).sort().reduce((acc, key) => {
      if (rest[key] !== undefined && rest[key] !== null) acc[key] = String(rest[key])
      return acc
    }, {} as Record<string, string>)

    const str = Object.values(sorted).join('')
    const key = await importPublicKey(publicKeyBase64)
    const enc = new TextEncoder()
    const sigBytes = Uint8Array.from(atob(platSign), c => c.charCodeAt(0))
    return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, sigBytes.buffer, enc.encode(str))
  } catch { return false }
}

// Format datetime yyyyMMddHHmmss
export function formatDateTime(): string {
  const now = new Date()
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

// Buat order JayaPay
export async function createOrder(params: {
  merchantCode: string
  privateKey: string
  mode: string
  orderNum: string
  amount: number
  method: string
  name: string
  email: string
  phone: string
  notifyUrl: string
  productDetail?: string
}): Promise<any> {
  const reqParams: Record<string, string> = {
    merchantCode: params.merchantCode,
    orderType: '0',
    method: params.method,
    orderNum: params.orderNum,
    payMoney: String(params.amount),
    productDetail: params.productDetail || 'Deposit INDONETWORK',
    notifyUrl: params.notifyUrl,
    dateTime: formatDateTime(),
    expiryPeriod: '60',
    name: params.name || 'User',
    email: params.email || 'user@indonetwork.com',
    phone: params.phone || '081234567890',
  }

  const sign = await generateSign(reqParams, params.privateKey)
  reqParams.sign = sign

  const url = params.mode === 'live' ? JAYAPAY_URL_LIVE : JAYAPAY_URL_TEST
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reqParams),
  })
  return res.json()
}

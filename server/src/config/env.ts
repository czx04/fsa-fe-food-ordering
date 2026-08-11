import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  CLIENT_ORIGINS: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017'),
  MONGODB_DB_NAME: z.string().min(1).default('food_ordering'),
  // KHÔNG hardcode secret thật. Các giá trị mặc định chỉ dùng cho dev;
  // ở production bắt buộc phải đặt từ biến môi trường (xem guard bên dưới).
  JWT_SECRET: z.string().min(1).default('dev-only-insecure-secret'),
  JWT_REFRESH_SECRET: z.string().min(1).default('dev-only-insecure-secret'),

  // VNPAY config
  VNPAY_MODE: z.enum(['mock', 'real']).default('real'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  VNP_TMNCODE: z.string().default('VNP_TEST'),
  VNP_HASHSECRET: z.string().default('dev-only-insecure-secret'),
  VNP_URL: z.string().default('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
  VNP_RETURN_URL: z.string().default('http://localhost:5173/payment/success'),
  // Sau bao nhiêu phút thì tự động hủy đơn VNPAY chưa hoàn tất thanh toán
  VNPAY_PAYMENT_TIMEOUT_MINUTES: z.coerce.number().int().min(1).default(30),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsedEnv.error.flatten().fieldErrors,
  )
  throw new Error('Invalid environment variables.')
}

// Fail-fast trong production nếu thiếu secret (không dùng giá trị mặc định dev).
const DEV_ONLY_VALUES = new Set(['dev-only-insecure-secret', 'VNP_TEST', ''])
if (parsedEnv.data.NODE_ENV === 'production') {
  const requiredSecrets = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'VNP_TMNCODE',
    'VNP_HASHSECRET',
  ] as const

  const missing = requiredSecrets.filter(
    (key) => DEV_ONLY_VALUES.has(parsedEnv.data[key]),
  )

  if (missing.length > 0) {
    console.error(
      '❌ Thiếu secret bắt buộc trong môi trường production:',
      missing.join(', '),
    )
    throw new Error(
      `Missing required secrets in production: ${missing.join(', ')}. Vui lòng đặt chúng trong biến môi trường.`,
    )
  }
}

const clientOrigins = (parsedEnv.data.CLIENT_ORIGINS
  ? parsedEnv.data.CLIENT_ORIGINS.split(',')
  : [parsedEnv.data.CLIENT_ORIGIN, 'http://localhost:5174'])
  .map((origin) => origin.trim())
  .filter((origin, index, values) => Boolean(origin) && values.indexOf(origin) === index)

export const env = {
  port: parsedEnv.data.PORT,
  clientOrigin: parsedEnv.data.CLIENT_ORIGIN,
  clientOrigins,
  nodeEnv: parsedEnv.data.NODE_ENV,
  mongodbUri: parsedEnv.data.MONGODB_URI,
  mongodbDbName: parsedEnv.data.MONGODB_DB_NAME,
  jwtSecret: parsedEnv.data.JWT_SECRET,
  jwtRefreshSecret: parsedEnv.data.JWT_REFRESH_SECRET,
  VNPAY_MODE: parsedEnv.data.VNPAY_MODE,
  CLIENT_URL: parsedEnv.data.CLIENT_URL,
  vnpTmnCode: parsedEnv.data.VNP_TMNCODE,
  vnpHashSecret: parsedEnv.data.VNP_HASHSECRET,
  vnpUrl: parsedEnv.data.VNP_URL,
  vnpReturnUrl: parsedEnv.data.VNP_RETURN_URL,
  vnpayPaymentTimeoutMinutes: parsedEnv.data.VNPAY_PAYMENT_TIMEOUT_MINUTES,
} as const

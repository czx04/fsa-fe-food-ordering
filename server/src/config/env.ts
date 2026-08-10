import 'dotenv/config'
import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  CLIENT_ORIGIN: z.string().url().default('http://localhost:5173'),
  CLIENT_ORIGINS: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017'),
  MONGODB_DB_NAME: z.string().min(1).default('food_ordering'),
  JWT_SECRET: z.string().min(1).default('fallback_secret'),
  JWT_REFRESH_SECRET: z.string().min(1).default('fallback_refresh_secret'),

  // VNPAY config
  VNPAY_MODE: z.enum(['mock', 'real']).default('real'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  VNP_TMNCODE: z.string().default('S4OIPMSN'),
  VNP_HASHSECRET: z.string().default('WZQVEDINGLPSQCNTEHYZKSVKGDMFKHXU'),
  VNP_URL: z.string().default('https://sandbox.vnpayment.vn/paymentv2/vpcpay.html'),
  VNP_RETURN_URL: z.string().default('http://localhost:5173/payment/success'),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  console.error(
    '❌ Invalid environment variables:',
    parsedEnv.error.flatten().fieldErrors,
  )
  throw new Error('Invalid environment variables.')
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
} as const

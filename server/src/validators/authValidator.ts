import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập email.')
    .email('Địa chỉ email không hợp lệ.'),
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu.'),
})

export const registerSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự.'),
  email: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập email.')
    .email('Địa chỉ email không hợp lệ.'),
  phone: z
    .string()
    .trim()
    .regex(/^(0|\+84)[3|5|7|8|9][0-9]{8}$/, 'Số điện thoại không đúng định dạng Việt Nam.'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự.'),
  role: z
    .enum(['customer', 'restaurant_owner'], {
      message: 'Vai trò người dùng không hợp lệ.',
    })
    .optional()
    .default('customer'),
})

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập email.')
    .email('Địa chỉ email không hợp lệ.'),
})

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Vui lòng nhập email.')
    .email('Địa chỉ email không hợp lệ.'),
  token: z
    .string()
    .min(1, 'Mã xác thực không được để trống.'),
  newPassword: z
    .string()
    .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự.'),
})

export const verifyEmailSchema = z.object({
  token: z
    .string()
    .min(1, 'Mã xác thực token không hợp lệ.'),
})

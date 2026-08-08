import nodemailer from 'nodemailer'

let transporter: nodemailer.Transporter | null = null

// Khởi tạo Transporter cho Nodemailer (Tự động dùng Ethereal Account nếu chưa có SMTP config trong env)
export const getEmailTransporter = async () => {
  if (transporter) return transporter

  // Kiểm tra nếu có cấu hình SMTP thực tế trong ENV
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
    return transporter
  }

  // Fallback: Tự động khởi tạo Ethereal Test Account cho môi trường Dev
  try {
    const testAccount = await nodemailer.createTestAccount()
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    })
    console.log('✉️ [Ethereal Email Setup] Test account created successfully:', testAccount.user)
  } catch (error) {
    console.error('❌ Failed to create Ethereal Email test account:', error)
  }

  return transporter
}

export const sendVerificationEmail = async (toEmail: string, token: string) => {
  const mailTransporter = await getEmailTransporter()
  if (!mailTransporter) {
    console.error('❌ Transporter is not available.')
    return null
  }

  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
  const verificationLink = `${clientUrl}/verify-email?token=${token}`

  const mailOptions = {
    from: '"MămMăm Food Ordering" <noreply@mammam.com>',
    to: toEmail,
    subject: 'Xác thực tài khoản MămMăm của bạn 🍔',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #ff5a1f; text-align: center;">MămMăm Food Ordering</h2>
        <h3 style="color: #333333;">Chào mừng bạn đến với MămMăm!</h3>
        <p style="color: #555555; line-height: 1.6;">
          Cảm ơn bạn đã đăng ký tài khoản. Vui lòng bấm vào nút bên dưới để hoàn tất việc xác thực địa chỉ email của bạn:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" style="background-color: #ff5a1f; color: #ffffff; padding: 14px 28px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;">Xác thực tài khoản ngay</a>
        </div>
        <p style="color: #777777; font-size: 13px;">
          Nếu nút trên không bấm được, bạn có thể copy và dán đường dẫn sau vào trình duyệt:<br/>
          <a href="${verificationLink}" style="color: #ff5a1f;">${verificationLink}</a>
        </p>
        <p style="color: #999999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
          Link xác thực này sẽ hết hạn sau 24 giờ. Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email.
        </p>
      </div>
    `,
  }

  try {
    const info = await mailTransporter.sendMail(mailOptions)
    const previewUrl = nodemailer.getTestMessageUrl(info)

    console.log('----------------------------------------------------')
    console.log(`🚀 [EMAIL SENT] Verification email sent to: ${toEmail}`)
    console.log(`🔑 Verification Link: ${verificationLink}`)
    if (previewUrl) {
      console.log(`🔗 [ETHEREAL PREVIEW URL] Bấm vào đây để xem trực tiếp Email:`)
      console.log(`👉 ${previewUrl}`)
    }
    console.log('----------------------------------------------------')

    return { info, previewUrl, verificationLink }
  } catch (error) {
    console.error('❌ Error sending verification email:', error)
    return null
  }
}

import nodemailer from 'nodemailer'

let transporter: nodemailer.Transporter | null = null

// Khởi tạo Transporter cho Nodemailer (Tự động dùng Ethereal Account nếu chưa có SMTP config trong env)
export const getEmailTransporter = async () => {
  // Kiểm tra nếu có cấu hình SMTP thực tế trong ENV
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 2525,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }

  if (transporter) return transporter

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

export const sendOrderConfirmationEmail = async (order: any) => {
  try {
    const toEmail = order.customerSnapshot?.email
    if (!toEmail) {
      console.warn('⚠️ Order confirmation email skipped: Customer email is missing')
      return null
    }

    const mailTransporter = await getEmailTransporter()
    if (!mailTransporter) {
      console.error('❌ Transporter is not available for order confirmation email.')
      return null
    }

    const clientUrl = process.env.CLIENT_ORIGIN || process.env.CLIENT_URL || 'http://localhost:5173'
    const orderLink = `${clientUrl}/orders/${order._id}`

    const formatVND = (amount: number) =>
      new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount)

    const itemsHtml = (order.items || [])
      .map(
        (item: any) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee; color: #333;">${item.name}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; color: #333;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #333;">${formatVND(item.finalUnitPrice || item.baseUnitPrice || 0)}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold; color: #333;">${formatVND(item.lineTotal || 0)}</td>
        </tr>
      `
      )
      .join('')

    const isPaid = order.paymentStatus === 'paid'
    const paymentStatusBadge = isPaid
      ? '<span style="background-color: #d4edda; color: #155724; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">ĐÃ THANH TOÁN</span>'
      : '<span style="background-color: #fff3cd; color: #856404; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">CHƯA THANH TOÁN (COD)</span>'

    const mailOptions = {
      from: '"MămMăm Food Ordering" <noreply@mammam.com>',
      to: toEmail,
      subject: `[MămMăm] Xác nhận đơn hàng #${order.orderNumber} 🛒`,
      html: `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid #f0f0f0;">
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #ff5a1f;">
            <h1 style="color: #ff5a1f; margin: 0; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">MămMăm<span style="color: #ffb703;">.</span></h1>
            <p style="color: #666666; margin-top: 6px; font-size: 14px; font-weight: 500;">Món ngon tận cửa · Giao hàng siêu tốc</p>
          </div>

          <div style="padding: 24px 0 16px 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
              <h2 style="color: #17201a; font-size: 20px; font-weight: 800; margin: 0;">Đơn hàng #${order.orderNumber}</h2>
              <div>${paymentStatusBadge}</div>
            </div>
            <p style="color: #526158; font-size: 14px; margin: 6px 0;"><strong>Nhà hàng:</strong> ${order.restaurantSnapshot?.name || 'N/A'}</p>
            <p style="color: #526158; font-size: 14px; margin: 6px 0;"><strong>Người nhận:</strong> ${order.recipient?.fullName} (${order.recipient?.phone})</p>
            <p style="color: #526158; font-size: 14px; margin: 6px 0;"><strong>Địa chỉ giao:</strong> ${order.recipient?.addressText}</p>
          </div>

          <h3 style="color: #17201a; font-size: 15px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px; margin-top: 16px;">Chi tiết món ăn</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 14px;">
            <thead>
              <tr style="background-color: #f7faf7; border-radius: 8px;">
                <th style="padding: 12px; text-align: left; color: #526158; font-weight: 700;">Món</th>
                <th style="padding: 12px; text-align: center; color: #526158; font-weight: 700;">SL</th>
                <th style="padding: 12px; text-align: right; color: #526158; font-weight: 700;">Đơn giá</th>
                <th style="padding: 12px; text-align: right; color: #526158; font-weight: 700;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="background-color: #f8faf8; padding: 18px; border-radius: 12px; border: 1px solid #e7ece8;">
            <table style="width: 100%; font-size: 14px;">
              <tr>
                <td style="color: #68736c; padding: 4px 0;">Tạm tính:</td>
                <td style="text-align: right; color: #17201a; font-weight: 600;">${formatVND(order.pricing?.subtotal || 0)}</td>
              </tr>
              <tr>
                <td style="color: #68736c; padding: 4px 0;">Phí giao hàng:</td>
                <td style="text-align: right; color: #17201a; font-weight: 600;">${formatVND(order.pricing?.deliveryFee || 0)}</td>
              </tr>
              ${
                (order.pricing?.discountAmount || 0) > 0
                  ? `<tr>
                      <td style="color: #ff5a1f; padding: 4px 0; font-weight: 600;">Mã giảm giá (${order.couponSnapshot?.code || ''}):</td>
                      <td style="text-align: right; color: #ff5a1f; font-weight: 700;">- ${formatVND(order.pricing.discountAmount)}</td>
                    </tr>`
                  : ''
              }
              <tr>
                <td style="border-top: 2px solid #e7ece8; padding-top: 12px; font-size: 16px; font-weight: 800; color: #17201a;">TỔNG THANH TOÁN:</td>
                <td style="border-top: 2px solid #e7ece8; padding-top: 12px; text-align: right; font-size: 20px; font-weight: 900; color: #ff5a1f;">${formatVND(order.pricing?.grandTotal || 0)}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 32px 0 20px 0;">
            <a href="${orderLink}" style="background-color: #ff5a1f; color: #ffffff; padding: 14px 32px; font-size: 15px; font-weight: 800; text-decoration: none; border-radius: 12px; display: inline-block; box-shadow: 0 4px 12px rgba(255,90,31,0.35);">Theo dõi chi tiết đơn hàng</a>
          </div>

          <p style="color: #9ca59f; font-size: 12px; text-align: center; border-top: 1px solid #f0f0f0; padding-top: 16px; margin-top: 24px; margin-bottom: 0;">
            Cần trợ giúp? Email <a href="mailto:hotro@mammam.vn" style="color: #ff5a1f; text-decoration: none; font-weight: 600;">hotro@mammam.vn</a> hoặc Hotline <strong>1900 8888</strong>.
          </p>
        </div>
      `,
    }

    const info = await mailTransporter.sendMail(mailOptions)
    const previewUrl = nodemailer.getTestMessageUrl(info)

    console.log('----------------------------------------------------')
    console.log(`🚀 [ORDER EMAIL SENT] Confirmation sent to: ${toEmail}`)
    console.log(`📦 Order Number: ${order.orderNumber}`)
    if (previewUrl) {
      console.log(`🔗 [ETHEREAL PREVIEW URL] Bấm vào đây để xem trực tiếp Email hóa đơn:`)
      console.log(`👉 ${previewUrl}`)
    }
    console.log('----------------------------------------------------')

    return { info, previewUrl }
  } catch (error) {
    console.error('❌ Error sending order confirmation email:', error)
    return null
  }
}


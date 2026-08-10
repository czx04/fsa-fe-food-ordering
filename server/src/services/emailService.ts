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
        <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 12px; background-color: #ffffff;">
          <div style="text-align: center; padding-bottom: 15px; border-bottom: 2px solid #ff5a1f;">
            <h1 style="color: #ff5a1f; margin: 0; font-size: 26px;">MămMăm Food Ordering</h1>
            <p style="color: #666; margin-top: 5px; font-size: 14px;">Cảm ơn bạn đã đặt hàng tại MămMăm!</p>
          </div>

          <div style="padding: 20px 0;">
            <h2 style="color: #333; font-size: 18px; margin-top: 0;">Thông tin đơn hàng #${order.orderNumber}</h2>
            <p style="color: #555; margin: 5px 0;"><strong>Nhà hàng:</strong> ${order.restaurantSnapshot?.name || 'N/A'}</p>
            <p style="color: #555; margin: 5px 0;"><strong>Người nhận:</strong> ${order.recipient?.fullName} - ${order.recipient?.phone}</p>
            <p style="color: #555; margin: 5px 0;"><strong>Địa chỉ giao hàng:</strong> ${order.recipient?.addressText}</p>
            <p style="color: #555; margin: 5px 0;"><strong>Phương thức thanh toán:</strong> ${(order.paymentMethod || '').toUpperCase()} (${paymentStatusBadge})</p>
          </div>

          <h3 style="color: #333; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 8px;">Chi tiết món ăn</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; text-align: left; color: #555;">Món</th>
                <th style="padding: 10px; text-align: center; color: #555;">SL</th>
                <th style="padding: 10px; text-align: right; color: #555;">Đơn giá</th>
                <th style="padding: 10px; text-align: right; color: #555;">Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div style="background-color: #fdfdfd; padding: 15px; border-radius: 8px; border: 1px solid #f0f0f0;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: #666;">Tạm tính:</span>
              <span style="color: #333; font-weight: 500;">${formatVND(order.pricing?.subtotal || 0)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
              <span style="color: #666;">Phí giao hàng:</span>
              <span style="color: #333; font-weight: 500;">${formatVND(order.pricing?.deliveryFee || 0)}</span>
            </div>
            ${
              (order.pricing?.discountAmount || 0) > 0
                ? `<div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #28a745;">
                    <span>Mã giảm giá (${order.couponSnapshot?.code || ''}):</span>
                    <span>- ${formatVND(order.pricing.discountAmount)}</span>
                  </div>`
                : ''
            }
            <div style="display: flex; justify-content: space-between; border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px; font-size: 18px; font-weight: bold; color: #ff5a1f;">
              <span>TỔNG CỘNG:</span>
              <span>${formatVND(order.pricing?.grandTotal || 0)}</span>
            </div>
          </div>

          <div style="text-align: center; margin: 30px 0 15px 0;">
            <a href="${orderLink}" style="background-color: #ff5a1f; color: #ffffff; padding: 12px 24px; font-weight: bold; text-decoration: none; border-radius: 8px; display: inline-block;">Theo dõi đơn hàng của bạn</a>
          </div>

          <p style="color: #999; font-size: 12px; text-align: center; border-top: 1px solid #eee; padding-top: 15px; margin-top: 25px;">
            Nếu bạn có thắc mắc về đơn hàng, vui lòng liên hệ bộ phận hỗ trợ MămMăm.
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


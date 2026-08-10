import { NextFunction, Request, Response } from 'express'
import { AuthRequest } from '../middlewares/authMiddleware.js'
import * as paymentService from '../services/paymentService.js'

export const verifyVnpayReturnHandler = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const vnpayResponse = req.query
    const order = await paymentService.verifyVnpayReturn(vnpayResponse)
    res.status(200).json(order)
  } catch (error) {
    next(error)
  }
}

export const vnpayIpnHandler = async (
  req: Request,
  res: Response,
  _next: NextFunction,
) => {
  try {
    const vnpayParams = { ...req.query, ...req.body }
    const result = await paymentService.processVnpayIpn(vnpayParams)
    res.status(200).json(result)
  } catch (error) {
    console.error('IPN Handler Error:', error)
    res.status(200).json({ RspCode: '99', Message: 'Unknown error' })
  }
}

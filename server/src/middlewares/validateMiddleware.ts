import { Request, Response, NextFunction } from 'express'
import { ZodSchema, ZodError } from 'zod'

interface ValidateOptions {
  body?: ZodSchema
  query?: ZodSchema
  params?: ZodSchema
}

export const validate = (options: ValidateOptions | ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if ('parseAsync' in options) {
        req.body = await options.parseAsync(req.body)
      } else {
        if (options.body) {
          req.body = await options.body.parseAsync(req.body)
        }
        if (options.query) {
          const parsedQuery = await options.query.parseAsync(req.query)
          if (typeof parsedQuery === 'object' && parsedQuery !== null) {
            Object.assign(req.query, parsedQuery)
          }
        }
        if (options.params) {
          const parsedParams = await options.params.parseAsync(req.params)
          if (typeof parsedParams === 'object' && parsedParams !== null) {
            Object.assign(req.params, parsedParams)
          }
        }
      }
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const firstError = error.issues[0]?.message || 'Dữ liệu không hợp lệ.'
        res.status(400).json({
          message: firstError,
          errors: error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        })
        return
      }
      next(error)
    }
  }
}

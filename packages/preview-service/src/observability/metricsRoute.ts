import express, { RequestHandler } from 'express'
import prometheusClient from 'prom-client'

export const metricsRouterFactory = () => {
  const metricsRouter = express.Router()

  metricsRouter.get(
    '/metrics',
    (async (_req, res) => {
      res.setHeader('Content-Type', prometheusClient.register.contentType)
      res.end(await prometheusClient.register.metrics())
    }) as RequestHandler //FIXME: this works around a type error with async, which is resolved in express 5
  )
  return metricsRouter
}
import type { Request, Response } from 'express'
import mongoose from 'mongoose'
import { InvestmentModel } from '../models/Investment.js'
import { computePortfolioAllocation, holdingValue, profitLoss, profitLossPercent } from '../utils/investmentReturns.js'

function toPublicInvestment(investment: {
  _id: unknown
  type: string
  name: string
  quantity: number
  purchasePrice: number
  currentValue: number
  createdAt?: Date
  updatedAt?: Date
}) {
  const value = holdingValue(investment.currentValue, investment.quantity)
  return {
    id: String(investment._id),
    type: investment.type,
    name: investment.name,
    quantity: investment.quantity,
    purchasePrice: investment.purchasePrice,
    currentValue: investment.currentValue,
    createdAt: investment.createdAt,
    updatedAt: investment.updatedAt,
    value,
    profitLoss: profitLoss(investment.purchasePrice, investment.currentValue, investment.quantity),
    profitLossPercent: profitLossPercent(investment.purchasePrice, investment.currentValue),
  }
}

export async function list(req: Request, res: Response) {
  const investments = await InvestmentModel.find({ userId: req.auth!.sub }).sort({ createdAt: -1 })
  const withAllocation = computePortfolioAllocation(investments.map(toPublicInvestment))
  res.json({ investments: withAllocation })
}

export async function create(req: Request, res: Response) {
  const investment = await InvestmentModel.create({ ...req.body, userId: req.auth!.sub })
  res.status(201).json({ investment: toPublicInvestment(investment) })
}

export async function getOne(req: Request, res: Response) {
  const { id } = req.params

  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ error: { message: 'Investment not found' } })
    return
  }

  const investment = await InvestmentModel.findOne({ _id: id, userId: req.auth!.sub })
  if (!investment) {
    res.status(404).json({ error: { message: 'Investment not found' } })
    return
  }

  res.json({ investment: toPublicInvestment(investment) })
}

export async function update(req: Request, res: Response) {
  const { id } = req.params

  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ error: { message: 'Investment not found' } })
    return
  }

  const investment = await InvestmentModel.findOne({ _id: id, userId: req.auth!.sub })
  if (!investment) {
    res.status(404).json({ error: { message: 'Investment not found' } })
    return
  }

  Object.assign(investment, req.body)
  await investment.save()

  res.json({ investment: toPublicInvestment(investment) })
}

export async function remove(req: Request, res: Response) {
  const { id } = req.params

  if (!mongoose.isValidObjectId(id)) {
    res.status(404).json({ error: { message: 'Investment not found' } })
    return
  }

  const investment = await InvestmentModel.findOneAndDelete({ _id: id, userId: req.auth!.sub })
  if (!investment) {
    res.status(404).json({ error: { message: 'Investment not found' } })
    return
  }

  res.status(204).send()
}

import { Schema, model, type InferSchemaType } from 'mongoose'

const investmentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['stock', 'mutual_fund', 'fixed_deposit', 'crypto', 'gold'],
      required: true,
    },
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 0 },
    // Per-unit, consistent with quantity/purchasePrice — see DECISIONS.md.
    purchasePrice: { type: Number, required: true, min: 0 },
    currentValue: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
)

export type Investment = InferSchemaType<typeof investmentSchema>

export const InvestmentModel = model('Investment', investmentSchema)

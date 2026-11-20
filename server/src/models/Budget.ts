import { Schema, model, type InferSchemaType } from 'mongoose'

const budgetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, required: true, trim: true },
    monthlyLimit: { type: Number, required: true, min: 0 },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
  },
  { timestamps: true },
)

// Secondary defense-in-depth alongside the case-insensitive application-level
// check in the controller (a Mongo unique index is case-sensitive by default,
// so it alone would let "Food" and "food" coexist for the same period).
budgetSchema.index({ userId: 1, category: 1, month: 1, year: 1 }, { unique: true })

export type Budget = InferSchemaType<typeof budgetSchema>

export const BudgetModel = model('Budget', budgetSchema)

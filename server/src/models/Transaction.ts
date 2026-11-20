import { Schema, model, type InferSchemaType } from 'mongoose'

const transactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    accountId: { type: Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    toAccountId: { type: Schema.Types.ObjectId, ref: 'Account' },
    amount: { type: Number, required: true, min: 0 },
    type: {
      type: String,
      enum: ['income', 'expense', 'transfer', 'investment'],
      required: true,
    },
    category: { type: String, required: true, trim: true },
    date: { type: Date, required: true },
    paymentMethod: { type: String, trim: true },
    notes: { type: String, trim: true },
  },
  { timestamps: true },
)

transactionSchema.index({ userId: 1, date: -1 })

export type Transaction = InferSchemaType<typeof transactionSchema>

export const TransactionModel = model('Transaction', transactionSchema)

import { Schema, model, type InferSchemaType } from 'mongoose'

const accountSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['savings', 'checking', 'credit', 'investment'],
      required: true,
    },
    balance: { type: Number, required: true, default: 0 },
    currency: { type: String, required: true, trim: true, uppercase: true },
    status: {
      type: String,
      enum: ['active', 'closed', 'frozen'],
      default: 'active',
      required: true,
    },
  },
  { timestamps: true },
)

export type Account = InferSchemaType<typeof accountSchema>

export const AccountModel = model('Account', accountSchema)

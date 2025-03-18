import mongoose, { Schema, Document } from 'mongoose';

export interface IContextHistory extends Document {
  contextId: string;
  version: number;
  content: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

const contextHistorySchema = new Schema<IContextHistory>(
  {
    contextId: {
      type: String,
      required: true,
      index: true,
    },
    version: {
      type: Number,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_, ret) => {
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Create compound index for efficient querying
contextHistorySchema.index({ contextId: 1, version: 1 }, { unique: true });

export const ContextHistory = mongoose.model<IContextHistory>('ContextHistory', contextHistorySchema); 
import mongoose, { Schema, Document } from 'mongoose';

export interface IContext extends Document {
  id: string;
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  version: number;
}

const contextSchema = new Schema<IContext>(
  {
    id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    version: {
      type: Number,
      required: true,
      default: 1,
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

// Create indexes for efficient querying
contextSchema.index({ content: 'text' });
contextSchema.index({ timestamp: -1 });
contextSchema.index({ version: 1 });

export const Context = mongoose.model<IContext>('Context', contextSchema); 
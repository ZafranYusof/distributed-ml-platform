import mongoose from 'mongoose';

const modelConfigSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  config: {
    type: {
      type: String,
      enum: ['linear', 'neural-network', 'cnn', 'rnn'],
      default: 'neural-network'
    },
    layers: { type: [Number], default: undefined },
    learningRate: Number,
    epochs: Number,
    batchSize: Number,
    numWorkers: Number,
    taskType: String,
    // CNN-specific
    filters: { type: [Number], default: undefined },
    kernelSizes: { type: [Number], default: undefined },
    poolSizes: { type: [Number], default: undefined },
    // RNN-specific
    rnnUnits: { type: [Number], default: undefined },
    rnnType: {
      type: String,
      enum: ['lstm', 'gru', 'simple'],
      default: 'lstm'
    },
    sequenceLength: Number,
    // Preprocessing
    preprocessing: {
      normalization: {
        type: String,
        enum: ['min-max', 'z-score', 'none'],
        default: 'min-max'
      },
      trainTestSplit: {
        type: Number,
        default: 0.8
      },
      selectedFeatures: { type: [String], default: undefined }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

modelConfigSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model('ModelConfig', modelConfigSchema);

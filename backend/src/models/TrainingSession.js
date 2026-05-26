import mongoose from 'mongoose';

const metricEntrySchema = new mongoose.Schema({
  epoch: Number,
  loss: Number,
  accuracy: Number,
  valLoss: Number,
  valAccuracy: Number,
  timestamp: Number
}, { _id: false });

const trainingSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    default: 'Untitled Session'
  },
  datasetName: String,
  config: {
    type: {
      type: String,
      enum: ['linear', 'neural-network', 'cnn', 'rnn'],
      default: 'neural-network'
    },
    layers: [Number],
    learningRate: Number,
    epochs: Number,
    batchSize: Number,
    numWorkers: Number,
    targetColumn: String,
    taskType: {
      type: String,
      enum: ['regression', 'classification']
    },
    outputShape: Number,
    preprocessing: {
      normalization: {
        type: String,
        enum: ['min-max', 'z-score', 'none'],
        default: 'min-max'
      },
      trainTestSplit: {
        type: Number,
        default: 0.8,
        min: 0.1,
        max: 0.95
      },
      selectedFeatures: [String]
    }
  },
  status: {
    type: String,
    enum: ['created', 'training', 'completed', 'failed'],
    default: 'created'
  },
  metrics: [metricEntrySchema],
  finalMetrics: {
    loss: Number,
    accuracy: Number,
    valLoss: Number,
    valAccuracy: Number,
    trainingTime: Number
  },
  modelWeights: {
    type: mongoose.Schema.Types.Mixed,
    select: false
  },
  normalization: {
    type: mongoose.Schema.Types.Mixed
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: Date
});

trainingSessionSchema.index({ userId: 1, startedAt: -1 });

export default mongoose.model('TrainingSession', trainingSessionSchema);

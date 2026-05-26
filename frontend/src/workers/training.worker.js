// ML Training Web Worker
// Each worker simulates a "node" in distributed training
import * as tf from '@tensorflow/tfjs';

let model = null;
let isTraining = false;

self.onmessage = async (e) => {
  const { type, payload } = e.data;

  switch (type) {
    case 'init':
      await handleInit(payload);
      break;
    case 'train':
      await handleTrain(payload);
      break;
    case 'getWeights':
      await handleGetWeights();
      break;
    case 'setWeights':
      await handleSetWeights(payload);
      break;
    case 'predict':
      await handlePredict(payload);
      break;
    case 'stop':
      isTraining = false;
      break;
  }
};

async function handleInit({ modelConfig, inputShape, outputShape }) {
  await tf.ready();

  if (modelConfig.type === 'linear') {
    model = tf.sequential();
    model.add(tf.layers.dense({
      units: outputShape,
      inputShape: [inputShape],
      activation: modelConfig.outputActivation || 'linear'
    }));
  } else if (modelConfig.type === 'neural-network') {
    model = tf.sequential();
    const layers = modelConfig.layers || [64, 32];
    layers.forEach((units, i) => {
      const config = {
        units,
        activation: 'relu'
      };
      if (i === 0) config.inputShape = [inputShape];
      model.add(tf.layers.dense(config));
    });
    model.add(tf.layers.dense({
      units: outputShape,
      activation: modelConfig.outputActivation || 'linear'
    }));
  } else if (modelConfig.type === 'cnn') {
    model = tf.sequential();
    const filters = modelConfig.filters || [32, 64];
    const kernelSizes = modelConfig.kernelSizes || [3, 3];

    // For tabular data, reshape to 1D conv: [features] -> [features, 1]
    // Input shape for conv1d: [steps, channels]
    model.add(tf.layers.reshape({
      targetShape: [inputShape, 1],
      inputShape: [inputShape]
    }));

    filters.forEach((f, i) => {
      const kernelSize = Math.min(kernelSizes[i] || 3, inputShape);
      model.add(tf.layers.conv1d({
        filters: f,
        kernelSize: kernelSize,
        activation: 'relu',
        padding: 'same'
      }));
      // Only pool if dimension is large enough
      if (inputShape > 2) {
        model.add(tf.layers.maxPooling1d({ poolSize: 2, padding: 'same' }));
      }
    });

    model.add(tf.layers.flatten());

    // Dense layers after conv
    const denseLayers = modelConfig.layers || [64, 32];
    denseLayers.forEach(units => {
      model.add(tf.layers.dense({ units, activation: 'relu' }));
    });

    model.add(tf.layers.dense({
      units: outputShape,
      activation: modelConfig.outputActivation || 'linear'
    }));
  } else if (modelConfig.type === 'rnn') {
    model = tf.sequential();
    const rnnUnits = modelConfig.rnnUnits || [64, 32];
    const rnnType = modelConfig.rnnType || 'lstm';
    const sequenceLength = modelConfig.sequenceLength || 10;

    // For tabular data, reshape to sequence: [features] -> [sequenceLength, featuresPerStep]
    // If inputShape doesn't divide evenly, pad conceptually
    const featuresPerStep = Math.max(1, Math.floor(inputShape / sequenceLength));
    const actualSeqLen = Math.ceil(inputShape / featuresPerStep);

    model.add(tf.layers.reshape({
      targetShape: [actualSeqLen, featuresPerStep],
      inputShape: [actualSeqLen * featuresPerStep]
    }));

    rnnUnits.forEach((units, i) => {
      const returnSequences = i < rnnUnits.length - 1;
      const config = {
        units,
        returnSequences
      };

      if (rnnType === 'lstm') {
        model.add(tf.layers.lstm(config));
      } else if (rnnType === 'gru') {
        model.add(tf.layers.gru(config));
      } else {
        model.add(tf.layers.simpleRNN(config));
      }
    });

    // Dense layers after RNN
    const denseLayers = modelConfig.layers || [32];
    denseLayers.forEach(units => {
      model.add(tf.layers.dense({ units, activation: 'relu' }));
    });

    model.add(tf.layers.dense({
      units: outputShape,
      activation: modelConfig.outputActivation || 'linear'
    }));

    // Store reshape info for prediction
    model._rnnInputShape = actualSeqLen * featuresPerStep;
  }

  const optimizer = tf.train.adam(modelConfig.learningRate || 0.01);
  const loss = modelConfig.loss || 'meanSquaredError';
  const metrics = modelConfig.metrics || ['mse'];

  model.compile({ optimizer, loss, metrics });

  self.postMessage({ type: 'initialized', payload: { params: model.countParams() } });
}

async function handleTrain({ xs, ys, epochs, batchSize, workerId }) {
  if (!model) {
    self.postMessage({ type: 'error', payload: { message: 'Model not initialized' } });
    return;
  }

  isTraining = true;

  // Handle RNN input reshaping - pad if needed
  let processedXs = xs;
  if (model._rnnInputShape && xs[0].length !== model._rnnInputShape) {
    processedXs = xs.map(row => {
      const padded = [...row];
      while (padded.length < model._rnnInputShape) padded.push(0);
      return padded.slice(0, model._rnnInputShape);
    });
  }

  const xTensor = tf.tensor2d(processedXs);
  const yTensor = tf.tensor2d(ys);

  const startTime = Date.now();
  let samplesProcessed = 0;

  for (let epoch = 0; epoch < epochs && isTraining; epoch++) {
    const epochStart = Date.now();

    const result = await model.fit(xTensor, yTensor, {
      epochs: 1,
      batchSize: batchSize || 32,
      shuffle: true,
      verbose: 0
    });

    samplesProcessed += processedXs.length;
    const elapsed = (Date.now() - startTime) / 1000;
    const samplesPerSec = samplesProcessed / elapsed;

    const loss = result.history.loss[0];
    const metrics = {};
    Object.keys(result.history).forEach(key => {
      metrics[key] = result.history[key][0];
    });

    self.postMessage({
      type: 'epoch_complete',
      payload: {
        workerId,
        epoch: epoch + 1,
        totalEpochs: epochs,
        loss,
        metrics,
        samplesPerSec: Math.round(samplesPerSec),
        epochTime: Date.now() - epochStart,
        progress: ((epoch + 1) / epochs) * 100
      }
    });
  }

  xTensor.dispose();
  yTensor.dispose();

  self.postMessage({
    type: 'training_complete',
    payload: { workerId }
  });
}

async function handleGetWeights() {
  if (!model) return;
  const weights = [];
  for (const layer of model.layers) {
    const layerWeights = layer.getWeights();
    const serialized = [];
    for (const w of layerWeights) {
      serialized.push({
        shape: w.shape,
        data: Array.from(await w.data())
      });
    }
    weights.push(serialized);
  }
  self.postMessage({ type: 'weights', payload: { weights } });
}

async function handleSetWeights({ weights }) {
  if (!model) return;
  for (let i = 0; i < model.layers.length; i++) {
    if (weights[i] && weights[i].length > 0) {
      const layerWeights = weights[i].map(w => tf.tensor(w.data, w.shape));
      model.layers[i].setWeights(layerWeights);
      // Dispose the tensors we created since setWeights copies the data
      layerWeights.forEach(t => t.dispose());
    }
  }
  self.postMessage({ type: 'weights_set' });
}

async function handlePredict({ input }) {
  if (!model) {
    self.postMessage({ type: 'error', payload: { message: 'Model not initialized' } });
    return;
  }

  // Handle RNN input padding
  let processedInput = input;
  if (model._rnnInputShape && input.length !== model._rnnInputShape) {
    processedInput = [...input];
    while (processedInput.length < model._rnnInputShape) processedInput.push(0);
    processedInput = processedInput.slice(0, model._rnnInputShape);
  }

  const inputTensor = tf.tensor2d([processedInput]);
  const prediction = model.predict(inputTensor);
  const result = Array.from(await prediction.data());
  inputTensor.dispose();
  prediction.dispose();
  self.postMessage({ type: 'prediction', payload: { result } });
}

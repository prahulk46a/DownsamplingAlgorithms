let lastSensorValue = 25000;
let lastTimestamp = Date.now();
const STEP_MS = 1000; // 1 sec

function generateSingleReading() {
  lastSensorValue += (Math.random() - 0.5) * 25;
  lastTimestamp += STEP_MS;

  return {
    ts: lastTimestamp,
    value: Number(lastSensorValue.toFixed(2))
  };
}

function generateBatch(count) {
  const data = [];
  for (let i = 0; i < count; i++) {
    data.push(generateSingleReading());
  }
  return data;
}

export { generateSingleReading, generateBatch };
function swingingDoor(data, tolerance) {
  if (data.length <= 2) return data;

  const result = [];
  let start = data[0];
  let maxLowerSlope = -Infinity;
  let minUpperSlope = Infinity;

  result.push(start);

  for (let i = 1; i < data.length; i++) {
    const curr = data[i];
    const dt = curr.ts - start.ts;
    if (!dt) continue;

    const upperSlope = (curr.value + tolerance - start.value) / dt;
    const lowerSlope = (curr.value - tolerance - start.value) / dt;

    maxLowerSlope = Math.max(maxLowerSlope, lowerSlope);
    minUpperSlope = Math.min(minUpperSlope, upperSlope);

    if (maxLowerSlope > minUpperSlope) {
      const prev = data[i - 1];
      result.push(prev);
      start = prev;
      maxLowerSlope = -Infinity;
      minUpperSlope = Infinity;
      i--;
    }
  }

  result.push(data[data.length - 1]);
  return result;
}

export { swingingDoor };
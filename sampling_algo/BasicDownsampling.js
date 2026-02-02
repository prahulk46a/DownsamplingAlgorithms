/* ------------------ DOWNSAMPLING ------------------ */

//Extrema Sampling: Selects minimum and maximum points within defined intervals to preserve significant data features.

function downsampleMinMax(data, maxPoints) {
  if (data.length <= maxPoints) return data;

  const bucketSize = Math.ceil(data.length / maxPoints);
  const sampled = [];

  for (let i = 0; i < data.length; i += bucketSize) {
    const bucket = data.slice(i, i + bucketSize);
    if (!bucket.length) continue;

    let min = bucket[0];
    let max = bucket[0];

    for (const p of bucket) {
      if (p.value < min.value) min = p;
      if (p.value > max.value) max = p;
    }
    min.ts < max.ts ? sampled.push(min, max) : sampled.push(max, min);
  }
  
  return sampled;
}
export { downsampleMinMax };
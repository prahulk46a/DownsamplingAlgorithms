//LTTB=> Reduce the number of points in a time series while preserving its visual characteristics.
function lttb(data, threshold) {
  if (threshold >= data.length || threshold <= 2) return data;

  const sampled = [];
  //First and last points are always included hence we need to divide the rest into equal parts
  const bucketSize = (data.length - 2) / (threshold - 2);
  let a = 0;

  sampled.push(data[a]);

  for (let i = 0; i < threshold - 2; i++) {
    const start = Math.floor((i + 1) * bucketSize) + 1;//start index of the bucket
    const end = Math.min(
      Math.floor((i + 2) * bucketSize) + 1, //end index of the bucket
      data.length - 1
    );

    //Average of points in the bucket
    let avgX = 0, avgY = 0;
    for (let j = start; j < end; j++) {
      avgX += data[j].ts;
      avgY += data[j].value;
    }
    avgX /= (end - start);
    avgY /= (end - start);


    //This Part is for Area Calculation 
    let maxArea = -1;
    let maxIndex = start;

    for (let j = Math.floor(i * bucketSize) + 1; j < start; j++) {
      const area = Math.abs(
        (data[a].ts - avgX) * (data[j].value - data[a].value) -
        (data[a].ts - data[j].ts) * (avgY - data[a].value)
      );

      if (area > maxArea) {
        maxArea = area;
        maxIndex = j;
      }
    }

    sampled.push(data[maxIndex]);
    a = maxIndex;
  }

  sampled.push(data[data.length - 1]);
  return sampled;
}
export { lttb };
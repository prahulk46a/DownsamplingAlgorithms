//Skip the specified number of points in the data array to reduce its size.
function decimate(data, factor) {
  const result = [];
  for (let i = 0; i < data.length; i += factor) {
    result.push(data[i]);
  }
  //This condition is to forcefully add the last point if not already included
  if (result[result.length - 1] !== data[data.length - 1]) {
    result.push(data[data.length - 1]);
  }
  return result;
}

export { decimate };
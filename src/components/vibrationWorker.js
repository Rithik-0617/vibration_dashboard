self.onmessage = async (e) => {
  const { url } = e.data;
  const resp = await fetch(url);
  const arr = await resp.json(); // expects array of numbers
  const floatArr = new Float32Array(arr);
  postMessage(floatArr.buffer, [floatArr.buffer]);
};

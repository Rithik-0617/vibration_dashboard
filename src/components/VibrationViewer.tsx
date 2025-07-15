import React, { useEffect, useRef, useState, useMemo } from 'react';
// @ts-ignore
import Plotly from 'plotly.js-dist-min';

// LTTB downsampling algorithm
function lttb(data: Float32Array, threshold: number): { x: number[]; y: number[] } {
  if (threshold >= data.length || threshold === 0) {
    return { x: Array.from({ length: data.length }, (_, i) => i), y: Array.from(data) };
  }
  const sampled: { x: number; y: number }[] = [];
  let bucketSize = (data.length - 2) / (threshold - 2);
  let a = 0, maxAreaPoint, maxArea, area;
  sampled.push({ x: 0, y: data[0] });
  for (let i = 0; i < threshold - 2; i++) {
    let avgX = 0, avgY = 0, avgRangeStart = Math.floor((i + 1) * bucketSize) + 1, avgRangeEnd = Math.floor((i + 2) * bucketSize) + 1;
    avgRangeEnd = avgRangeEnd < data.length ? avgRangeEnd : data.length;
    let avgRangeLength = avgRangeEnd - avgRangeStart;
    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += j;
      avgY += data[j];
    }
    avgX /= avgRangeLength || 1;
    avgY /= avgRangeLength || 1;
    let rangeOffs = Math.floor(i * bucketSize) + 1, rangeTo = Math.floor((i + 1) * bucketSize) + 1;
    rangeTo = rangeTo < data.length ? rangeTo : data.length;
    maxArea = -1;
    for (let j = rangeOffs; j < rangeTo; j++) {
      area = Math.abs(
        (a - avgX) * (data[j] - data[a]) -
        (a - j) * (avgY - data[a])
      ) * 0.5;
      if (area > maxArea) {
        maxArea = area;
        maxAreaPoint = j;
      }
    }
    sampled.push({ x: maxAreaPoint!, y: data[maxAreaPoint!] });
    a = maxAreaPoint!;
  }
  sampled.push({ x: data.length - 1, y: data[data.length - 1] });
  return {
    x: sampled.map(p => p.x),
    y: sampled.map(p => p.y)
  };
}

const VibrationViewer: React.FC = () => {
  // Generate mock time series data
  const [dataPts] = useState<{ timestamp: string; value: number }[]>(
    Array.from({ length: 10000 }, (_, i) => ({
      timestamp: new Date(Date.now() + i * 10).toISOString(),
      value: Math.sin(i * 0.01) * 10 + Math.random() * 2
    }))
  );
  const plotRef = useRef<HTMLDivElement>(null);

  // Chart data (downsampled)
  const chartData = useMemo(() => {
    if (!dataPts.length) return { x: [], y: [] };
    const yArr = Float32Array.from(dataPts.map(d => d.value));
    const lttbRes = lttb(yArr, 1500);
    const x = lttbRes.x.map(i => {
      const ts = dataPts[i]?.timestamp;
      return ts ? new Date(ts).toLocaleTimeString() : '';
    });
    return { x, y: lttbRes.y };
  }, [dataPts]);

  // Plotly rendering
  useEffect(() => {
    if (!plotRef.current || !chartData.x.length) return;
    // @ts-ignore
    Plotly.react(plotRef.current, [{
      x: chartData.x,
      y: chartData.y,
      type: 'scattergl',
      mode: 'lines',
      line: { color: '#14b8a6', width: 1 },
      name: 'Mock Time Series'
    }], {
      margin: { t: 20, l: 40, r: 20, b: 40 },
      xaxis: { title: 'Time', showgrid: false },
      yaxis: { title: 'Value', showgrid: false },
      dragmode: 'pan',
      height: 320,
      legend: { orientation: 'h', x: 0.5, xanchor: 'center', y: -0.2 }
    }, { responsive: true });
  }, [chartData]);

  return (
    <div className="space-y-4">
      <div className="font-semibold text-gray-800">Vibration Viewer (Demo)</div>
      <div
        ref={plotRef}
        className="w-full bg-white rounded-xl shadow border border-gray-100"
        style={{ minHeight: 340, cursor: 'grab' }}
      />
      <div className="text-xs text-gray-500">
        Showing {dataPts.length} samples (downsampled for display)
      </div>
    </div>
  );
};

export default VibrationViewer;


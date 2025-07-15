import React, { useMemo, useRef } from 'react';
import { VibrationData, lttb } from '../utils/dataUtils';

interface TimeSeriesGraphProps {
  vibrationData: VibrationData | null;
  selectedChasisId: string;
}

const TimeSeriesGraph: React.FC<TimeSeriesGraphProps> = ({
  vibrationData,
  selectedChasisId
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Prepare downsampled time series data for display with LTTB
  const timeSeriesData = useMemo(() => {
    if (!vibrationData || vibrationData.values.length === 0) return [];
    
    // Use LTTB downsampling for better performance while preserving shape
    const sampledData = lttb(vibrationData.values, 5000);
    
    return sampledData.x.map((x, i) => ({
      x: x,
      y: sampledData.y[i]
    }));
  }, [vibrationData]);

  const defaultTimeSeriesData = Array.from({ length: 100 }, (_, i) => ({ x: i, y: 0 }));

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Time Series (Optimized Rendering)</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className={`w-2 h-2 rounded-full ${vibrationData ? 'bg-primary-500' : 'bg-gray-400'}`}></div>
          <span>{selectedChasisId ? `Chassis ${selectedChasisId}` : 'No Data'}</span>
          {vibrationData && (
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
              {vibrationData.values.length.toLocaleString()} samples
            </span>
          )}
        </div>
      </div>
      
      <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <div className="relative h-64 bg-gray-50 rounded-xl overflow-hidden" ref={scrollRef} style={{ minWidth: '1600px' }}>
          <svg className="w-full h-full" viewBox="0 0 1600 264" preserveAspectRatio="none">
            <defs>
              <linearGradient id="timeSeriesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#14b8a6" stopOpacity="0"/>
              </linearGradient>
            </defs>
            {/* Grid lines */}
            <g stroke="#e5e7eb" strokeWidth="0.5" opacity="0.7">
              {[...Array(9)].map((_, i) => (
                <line key={`h-${i}`} x1={0} y1={i * 32} x2={1600} y2={i * 32} />
              ))}
              {[...Array(33)].map((_, i) => (
                <line key={`v-${i}`} x1={i * 50} y1={0} x2={i * 50} y2={264} />
              ))}
            </g>
            {/* Time series smooth line */}
            {(timeSeriesData.length > 0 ? timeSeriesData : defaultTimeSeriesData).length > 1 && (
              <>
                {/* Filled area under curve */}
                <path
                  d={`M ${(timeSeriesData.length > 0 ? timeSeriesData : defaultTimeSeriesData).map((point, i, arr) => {
                    const x = (i / (arr.length - 1)) * 1600;
                    const dataToUse = timeSeriesData.length > 0 ? timeSeriesData : defaultTimeSeriesData;
                    const maxVal = Math.max(...dataToUse.map(p => Math.abs(p.y))) || 1;
                    const y = 132 - (point.y / maxVal) * 120;
                    return `${x},${Math.max(12, Math.min(252, y))}`;
                  }).join(' L ')} L 1600,252 L 0,252 Z`}
                  fill={timeSeriesData.length > 0 ? "url(#timeSeriesGradient)" : "none"}
                  opacity="0.6"
                />
                {/* Smooth line */}
                <path
                  d={`M ${(timeSeriesData.length > 0 ? timeSeriesData : defaultTimeSeriesData).map((point, i, arr) => {
                    const x = (i / (arr.length - 1)) * 1600;
                    const dataToUse = timeSeriesData.length > 0 ? timeSeriesData : defaultTimeSeriesData;
                    const maxVal = Math.max(...dataToUse.map(p => Math.abs(p.y))) || 1;
                    const y = 132 - (point.y / maxVal) * 120;
                    return `${x},${Math.max(12, Math.min(252, y))}`;
                  }).join(' L ')}`}
                  fill="none"
                  stroke={timeSeriesData.length > 0 ? "#14b8a6" : "#d1d5db"}
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={timeSeriesData.length > 0 ? 1 : 0.5}
                />
              </>
            )}
          </svg>
          {/* Axis labels */}
          <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white px-1 rounded">
            0
          </div>
          <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-1 rounded">
            {vibrationData ? vibrationData.values.length.toLocaleString() : '100'}
          </div>
          <div className="absolute top-2 left-2 text-xs text-gray-500 bg-white px-1 rounded">Amplitude</div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
        <span>Sampling Rate: {vibrationData ? (vibrationData.samplingRate / 1000).toFixed(1) : '25.6'} kHz</span>
        <span>RMS: {vibrationData ? Math.sqrt(vibrationData.values.reduce((sum, val) => sum + val * val, 0) / vibrationData.values.length).toFixed(2) : '0.00'}</span>
        {timeSeriesData.length > 0 && vibrationData && (
          <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
            Showing {timeSeriesData.length} of {vibrationData.values.length.toLocaleString()} points
          </span>
        )}
      </div>
    </div>
  );
};

export default TimeSeriesGraph;

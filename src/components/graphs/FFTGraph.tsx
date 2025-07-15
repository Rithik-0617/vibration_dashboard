import React, { useMemo } from 'react';
import { Zap } from 'lucide-react';
import { VibrationData, calculateOptimizedFFT } from '../utils/dataUtils';

interface FFTGraphProps {
  vibrationData: VibrationData | null;
}

const FFTGraph: React.FC<FFTGraphProps> = ({ vibrationData }) => {
  // Prepare optimized FFT data for display
  const fftData = useMemo(() => {
    if (!vibrationData || vibrationData.values.length === 0) return [];
    
    // Use optimized FFT calculation
    const fftRaw = calculateOptimizedFFT(vibrationData.values, vibrationData.samplingRate, 2048);
    return fftRaw.slice(0, 1000); // Show only first 1000 frequency bins for performance
  }, [vibrationData]);

  const defaultFFTData = Array.from({ length: 50 }, (_, i) => ({ magnitude: 0, frequency: i * 10 }));

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">FFT Analysis (Optimized)</h3>
        <div className="flex items-center space-x-2">
          <Zap className="w-4 h-4 text-secondary-500" />
          <span className="text-sm text-gray-600">Frequency Domain</span>
        </div>
      </div>
      
      <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
        <div className="relative h-64 bg-gray-50 rounded-xl overflow-hidden" style={{ minWidth: '1600px' }}>
          <svg className="w-full h-full" viewBox="0 0 1600 264" preserveAspectRatio="none">
            <defs>
              <linearGradient id="fftGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6"/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
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
            {/* FFT spectrum */}
            {(fftData.length > 0 ? fftData : defaultFFTData).length > 1 && (
              <>
                {/* Filled area */}
                <path
                  d={`M ${(fftData.length > 0 ? fftData : defaultFFTData).map((point, i, arr) => {
                    const x = (i / (arr.length - 1)) * 1600;
                    const dataToUse = fftData.length > 0 ? fftData : defaultFFTData;
                    const maxMagnitude = Math.max(...dataToUse.map(p => p.magnitude)) || 1;
                    const y = 252 - (point.magnitude / maxMagnitude) * 240;
                    return `${x},${Math.max(12, Math.min(252, y))}`;
                  }).join(' L ')} L 1600,252 L 0,252 Z`}
                  fill="url(#fftGradient)"
                  opacity="0.8"
                />
                {/* Spectrum line */}
                <path
                  d={`M ${(fftData.length > 0 ? fftData : defaultFFTData).map((point, i, arr) => {
                    const x = (i / (arr.length - 1)) * 1600;
                    const dataToUse = fftData.length > 0 ? fftData : defaultFFTData;
                    const maxMagnitude = Math.max(...dataToUse.map(p => p.magnitude)) || 1;
                    const y = 252 - (point.magnitude / maxMagnitude) * 240;
                    return `${x},${Math.max(12, Math.min(252, y))}`;
                  }).join(' L ')}`}
                  fill="none"
                  stroke={fftData.length > 0 ? "#3b82f6" : "#d1d5db"}
                  strokeWidth="1"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={fftData.length > 0 ? 1 : 0.5}
                />
              </>
            )}
          </svg>
          {/* Axis labels */}
          <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white px-1 rounded">0 Hz</div>
          <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-1 rounded">
            5 kHz
          </div>
          <div className="absolute top-2 left-2 text-xs text-gray-500 bg-white px-1 rounded">|Xₖ|</div>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
        <span>
          Peak Frequency: {
            fftData.length > 0 
              ? fftData.reduce((max, current) => current.magnitude > max.magnitude ? current : max).frequency.toFixed(1)
              : '0'
          } Hz
        </span>
        <span>
          Peak Magnitude: {
            fftData.length > 0 
              ? Math.max(...fftData.map(p => p.magnitude)).toFixed(1)
              : '0'
          }
        </span>
        {fftData.length > 0 && (
          <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded">
            {fftData.length} frequency bins
          </span>
        )}
      </div>
    </div>
  );
};

export default FFTGraph;

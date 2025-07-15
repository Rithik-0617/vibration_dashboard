import React from 'react';
import { VibrationData } from '../utils/dataUtils';

interface AnalysisSummaryProps {
  vibrationData: VibrationData | null;
  fftData: { magnitude: number; frequency: number }[];
  loadingData: boolean;
}

const AnalysisSummary: React.FC<AnalysisSummaryProps> = ({
  vibrationData,
  fftData,
  loadingData
}) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Analysis Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
          <div className="text-green-800 font-medium">Data Quality</div>
          <div className="text-2xl font-bold text-green-600">
            {vibrationData ? (vibrationData.values.length >= 1000 ? 'Excellent' : 'Good') : 'No Data'}
          </div>
          <div className="text-sm text-green-600">{vibrationData ? vibrationData.values.length.toLocaleString() : 0} samples collected</div>
        </div>
        <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-4 rounded-xl border border-yellow-200">
          <div className="text-yellow-800 font-medium">Dominant Frequency</div>
          <div className="text-2xl font-bold text-yellow-600">
            {fftData.length > 0 
              ? `${fftData.reduce((max, current) => current.magnitude > max.magnitude ? current : max).frequency.toFixed(0)} Hz`
              : '0 Hz'
            }
          </div>
          <div className="text-sm text-yellow-600">Peak in spectrum</div>
        </div>
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
          <div className="text-blue-800 font-medium">Processing Status</div>
          <div className="text-2xl font-bold text-blue-600">
            {loadingData ? 'Loading...' : 'Optimized'}
          </div>
          <div className="text-sm text-blue-600">
            {vibrationData ? 'LTTB Downsampled' : 'No Data'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisSummary;

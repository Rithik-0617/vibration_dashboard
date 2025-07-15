import React from 'react';
import { AlertTriangle, CheckCircle, AlertCircle, Info } from 'lucide-react';

const PieChartView: React.FC = () => {
  const faultData = [
    { name: 'Normal Operation', value: 65, color: '#10b981', icon: CheckCircle },
    { name: 'Bearing Defects', value: 20, color: '#f59e0b', icon: AlertCircle },
    { name: 'Misalignment', value: 10, color: '#ef4444', icon: AlertTriangle },
    { name: 'Imbalance', value: 5, color: '#8b5cf6', icon: Info },
  ];

  const total = faultData.reduce((sum, item) => sum + item.value, 0);
  let cumulativePercentage = 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">π</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Fault Distribution Analysis</h2>
          <p className="text-gray-600">System health breakdown and fault categories</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-6 text-center">Fault Distribution</h3>
          
          <div className="relative flex justify-center">
            <svg width="280" height="280" className="transform -rotate-90">
              <circle
                cx="140"
                cy="140"
                r="120"
                fill="none"
                stroke="#f3f4f6"
                strokeWidth="20"
              />
              
              {faultData.map((item, index) => {
                const percentage = (item.value / total) * 100;
                const strokeDasharray = `${(percentage / 100) * 753.98} 753.98`;
                const strokeDashoffset = -((cumulativePercentage / 100) * 753.98);
                
                cumulativePercentage += percentage;
                
                return (
                  <circle
                    key={index}
                    cx="140"
                    cy="140"
                    r="120"
                    fill="none"
                    stroke={item.color}
                    strokeWidth="20"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300 hover:stroke-opacity-80"
                    style={{ strokeLinecap: 'round' }}
                  />
                );
              })}
            </svg>
            
            {/* Center info */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-800">{total}%</div>
                <div className="text-sm text-gray-600">Total Analysis</div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend and Details */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Fault Categories</h3>
            
            <div className="space-y-3">
              {faultData.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={index} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: item.color }}
                      ></div>
                      <Icon className="w-5 h-5" style={{ color: item.color }} />
                      <span className="font-medium text-gray-800">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-800">{item.value}%</div>
                      <div className="text-xs text-gray-500">of total</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recommendations</h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-yellow-800">Monitor Bearing Health</div>
                  <div className="text-sm text-yellow-700">20% bearing defects detected. Schedule maintenance check.</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-xl border border-red-200">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-red-800">Address Misalignment</div>
                  <div className="text-sm text-red-700">10% misalignment issues require immediate attention.</div>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-xl border border-green-200">
                <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-medium text-green-800">System Stability</div>
                  <div className="text-sm text-green-700">65% normal operation indicates good overall health.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Trend Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {faultData.map((item, index) => (
            <div key={index} className="text-center p-4 rounded-xl bg-gray-50">
              <div className="text-2xl font-bold mb-2" style={{ color: item.color }}>
                {item.value > 50 ? '↗' : item.value > 15 ? '→' : '↘'}
              </div>
              <div className="font-medium text-gray-800">{item.name}</div>
              <div className="text-sm text-gray-600 mt-1">
                {item.value > 50 ? 'Stable' : item.value > 15 ? 'Monitor' : 'Improving'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Fetching Note */}
      <div className="text-sm text-gray-500">
        {/* If you add chassis ID selection and data loading here, use: */}
        {/* fetch(`/vibrationjson/${chasisId}.json`) */}
      </div>
    </div>
  );
};

export default PieChartView;
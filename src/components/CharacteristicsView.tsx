import React, { useState, useEffect, useCallback } from 'react';
import { BarChart3, ChevronDown, Search, Activity, Zap, TrendingUp } from 'lucide-react';
import { getAvailableChassisIds } from './utils/dataUtils';

const CharacteristicsView: React.FC = () => {
  const [selectedChasisId, setSelectedChasisId] = useState('');
  const [selectedScrewCount, setSelectedScrewCount] = useState('');
  const [chasisDropdownOpen, setChasisDropdownOpen] = useState(false);
  const [screwDropdownOpen, setScrewDropdownOpen] = useState(false);
  const [chasisSearchTerm, setChasisSearchTerm] = useState('');
  const [screwSearchTerm, setScrewSearchTerm] = useState('');
  const [chasisIds, setChasisIds] = useState<string[]>([]);
  const [loadingChasisIds, setLoadingChasisIds] = useState(false);

  // Load available chassis IDs from the vibrationjson folder
  const loadChasisIds = useCallback(async () => {
    setLoadingChasisIds(true);
    try {
      const ids = await getAvailableChassisIds();
      console.log('Available chassis IDs:', ids);
      setChasisIds(ids);
    } catch (error) {
      console.error('Error loading chassis IDs:', error);
      setChasisIds([]);
    } finally {
      setLoadingChasisIds(false);
    }
  }, []);

  useEffect(() => {
    loadChasisIds();
    // Refresh every 30 seconds to detect new files
    const interval = setInterval(loadChasisIds, 30000);
    return () => clearInterval(interval);
  }, [loadChasisIds]);

  const vibrationMetrics = [
    {
      name: 'Skewness',
      value: '0.85',
      unit: '',
      description: 'Asymmetry of distribution'
    },
    {
      name: 'Kurtosis',
      value: '4.1',
      unit: '',
      description: 'Statistical measure of impulsiveness'
    },
    {
      name: 'Peak_to_Peak',
      value: '15.7',
      unit: 'mm/s',
      description: 'Maximum displacement range'
    },
    {
      name: 'RMS',
      value: '2.43',
      unit: 'm/s²',
      description: 'Root Mean Square'
    },
    {
      name: 'SNR_dB',
      value: '32.5',
      unit: 'dB',
      description: 'Signal to Noise Ratio'
    },
    {
      name: 'Entropy',
      value: '3.78',
      unit: 'bits',
      description: 'Information entropy measure'
    }
  ];

  // Screw count options 1-19
  const screwCounts = Array.from({ length: 19 }, (_, i) => (i + 1).toString());

  const filteredChasisIds = chasisIds.filter(id => 
    id.toLowerCase().includes(chasisSearchTerm.toLowerCase())
  );

  const filteredScrewCounts = screwCounts.filter(count => 
    count.includes(screwSearchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <BarChart3 className="w-8 h-8 text-primary-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Vibration Characteristics</h2>
          <p className="text-gray-600">Detailed statistical analysis of vibration parameters</p>
        </div>
      </div>

      {/* Dropdown Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Chassis ID Dropdown */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Chassis ID
            {loadingChasisIds && <span className="ml-2 text-xs text-blue-600">(Loading...)</span>}
          </label>
          <div className="relative">
            <button
              onClick={() => setChasisDropdownOpen(!chasisDropdownOpen)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={loadingChasisIds}
            >
              <span className={selectedChasisId ? 'text-gray-800' : 'text-gray-500'}>
                {selectedChasisId || 'Select Chassis ID'}
              </span>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </button>
            
            {chasisDropdownOpen && !loadingChasisIds && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search chassis ID..."
                      value={chasisSearchTerm}
                      onChange={(e) => setChasisSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && chasisSearchTerm.trim()) {
                          setSelectedChasisId(chasisSearchTerm.trim());
                          setChasisDropdownOpen(false);
                          setChasisSearchTerm('');
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredChasisIds.length > 0 ? (
                    filteredChasisIds.map((id) => (
                      <button
                        key={id}
                        onClick={() => {
                          setSelectedChasisId(id);
                          setChasisDropdownOpen(false);
                          setChasisSearchTerm('');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 flex items-center justify-between"
                      >
                        <span>{id}</span>
                        <span className="text-xs text-gray-400">.json</span>
                      </button>
                    ))
                  ) : chasisSearchTerm ? (
                    <button
                      onClick={() => {
                        setSelectedChasisId(chasisSearchTerm.trim());
                        setChasisDropdownOpen(false);
                        setChasisSearchTerm('');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 text-blue-600"
                    >
                      Use "{chasisSearchTerm.trim()}" as Chassis ID
                    </button>
                  ) : (
                    <div className="px-4 py-3 text-gray-500 text-sm">
                      {chasisIds.length === 0 
                        ? 'No .json files found in /vibrationjson/ folder.'
                        : 'No matching chassis IDs found.'
                      }
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          {chasisIds.length > 0 && (
            <div className="mt-1 text-xs text-gray-500">
              Found {chasisIds.length} chassis file{chasisIds.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Screw Count Dropdown */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 mb-2">Screw Count</label>
          <div className="relative">
            <button
              onClick={() => setScrewDropdownOpen(!screwDropdownOpen)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <span className={selectedScrewCount || 'text-gray-500'}>
                {selectedScrewCount || 'Select Screw Count'}
              </span>
              <ChevronDown className="w-5 h-5 text-gray-400" />
            </button>
            
            {screwDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
                <div className="p-3 border-b border-gray-200">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search screw count..."
                      value={screwSearchTerm}
                      onChange={(e) => setScrewSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredScrewCounts.map((count) => (
                    <button
                      key={count}
                      onClick={() => {
                        setSelectedScrewCount(count);
                        setScrewDropdownOpen(false);
                        setScrewSearchTerm('');
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {vibrationMetrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="text-center">
              <h3 className="font-semibold text-gray-800 text-lg mb-3">{metric.name}</h3>
              <div className="flex items-baseline justify-center space-x-2 mb-2">
                <span className="text-3xl font-bold text-gray-800">{metric.value}</span>
                {metric.unit && <span className="text-sm text-gray-600">{metric.unit}</span>}
              </div>
              <p className="text-sm text-gray-600">{metric.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Analysis Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statistical Overview */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Statistical Overview</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <span className="text-green-800 font-medium">Parameters in Normal Range</span>
              <span className="text-2xl font-bold text-green-600">4/6</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-xl">
              <span className="text-yellow-800 font-medium">Parameters Requiring Attention</span>
              <span className="text-2xl font-bold text-yellow-600">1/6</span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
              <span className="text-red-800 font-medium">Critical Parameters</span>
              <span className="text-2xl font-bold text-red-600">1/6</span>
            </div>
          </div>
        </div>

        {/* Trending Analysis */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Trending Analysis</h3>
          
          <div className="space-y-3">
            <div className="p-3 bg-red-50 rounded-xl border border-red-200">
              <div className="flex items-center space-x-2 mb-1">
                <Zap className="w-4 h-4 text-red-600" />
                <span className="font-medium text-red-800">High Kurtosis Alert</span>
              </div>
              <p className="text-sm text-red-700">Kurtosis value of 4.1 exceeds normal range. This may indicate impulsive behavior or potential bearing issues.</p>
            </div>
            
            <div className="p-3 bg-yellow-50 rounded-xl border border-yellow-200">
              <div className="flex items-center space-x-2 mb-1">
                <TrendingUp className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Peak-to-Peak Increase</span>
              </div>
              <p className="text-sm text-yellow-700">Peak-to-Peak displacement shows 8.3% increase. Monitor for potential misalignment issues.</p>
            </div>
            
            <div className="p-3 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center space-x-2 mb-1">
                <Activity className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">RMS Stability</span>
              </div>
              <p className="text-sm text-green-700">RMS velocity remains stable within acceptable limits with minimal variation.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Historical Comparison */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">30-Day Historical Comparison</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-800">Parameter</th>
                <th className="text-center py-3 px-2 font-medium text-gray-800">Current</th>
                <th className="text-center py-3 px-2 font-medium text-gray-800">7 Days Ago</th>
                <th className="text-center py-3 px-2 font-medium text-gray-800">30 Days Ago</th>
                <th className="text-center py-3 px-2 font-medium text-gray-800">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vibrationMetrics.slice(0, 4).map((metric, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium text-gray-800">{metric.name}</td>
                  <td className="py-3 px-2 text-center">{metric.value} {metric.unit}</td>
                  <td className="py-3 px-2 text-center text-gray-600">
                    {(parseFloat(metric.value) * 0.95).toFixed(2)} {metric.unit}
                  </td>
                  <td className="py-3 px-2 text-center text-gray-600">
                    {(parseFloat(metric.value) * 0.88).toFixed(2)} {metric.unit}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-600">
                      ↘ Declining
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CharacteristicsView;
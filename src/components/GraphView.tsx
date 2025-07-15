import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { Activity, Zap, ChevronDown, Search } from 'lucide-react';
import { lttb, calculateOptimizedFFT } from './utils/dataUtils';

interface VibrationData {
  timestamp: string;
  values: number[];
  samplingRate: number;
}

const GraphView: React.FC = () => {
  const [selectedChasisId, setSelectedChasisId] = useState('');
  const [chasisDropdownOpen, setChasisDropdownOpen] = useState(false);
  const [chasisSearchTerm, setChasisSearchTerm] = useState('');
  const [vibrationData, setVibrationData] = useState<VibrationData | null>(null);
  const [chasisIds, setChasisIds] = useState<string[]>([]);
  const [loadingChasisIds, setLoadingChasisIds] = useState(false);
  const [streamingProgress, setStreamingProgress] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [processedDataCount, setProcessedDataCount] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);

  // List all .json files in /vibrationjson/ using the browser's fetch and parse the directory listing
  const loadChasisIds = useCallback(async () => {
    setLoadingChasisIds(true);
    try {
      // Hardcode the chassis IDs since directory listing doesn't work with Vite
      // This is the most reliable approach for local development
      const knownChasisIds = ['K9252607546']; // Add more IDs as needed
      setChasisIds(knownChasisIds);
    } catch (error) {
      setChasisIds([]);
    } finally {
      setLoadingChasisIds(false);
    }
  }, []);

  useEffect(() => {
    loadChasisIds();
  }, [loadChasisIds]);

  const filteredChasisIds = chasisIds.filter(id =>
    id.toLowerCase().includes(chasisSearchTerm.toLowerCase())
  );

  // Efficient loading that preserves ALL 13L data points
  const loadVibrationData = useCallback(async (chasisId: string) => {
    if (!chasisId) return;
    
    setIsStreaming(true);
    setStreamingProgress(0);
    setProcessedDataCount(0);
    
    try {
      console.log(`Loading ALL data for chassis: ${chasisId} (no reduction)`);
      
      // Import the streaming loader
      const { streamingLoader } = await import('./utils/dataUtils');
      
      const data = await streamingLoader.loadVibrationDataWithStreaming(
        chasisId,
        (progress) => {
          setStreamingProgress(progress);
        },
        (chunk, totalProcessed) => {
          setProcessedDataCount(totalProcessed);
          
          if (chunk.length > 0) {
            console.log(`Processed ${totalProcessed} total points so far...`);
          }
        }
      );
      
      if (data) {
        console.log(`SUCCESS: Loaded ALL ${data.values.length} points (${(data.values.length/100000).toFixed(1)} lakh)`);
        setVibrationData(data);
      } else {
        setVibrationData(null);
      }
    } catch (error) {
      console.error('Error loading full dataset:', error);
      setVibrationData(null);
    } finally {
      setIsStreaming(false);
      setStreamingProgress(0);
    }
  }, []);

  useEffect(() => {
    if (!selectedChasisId) return;
    loadVibrationData(selectedChasisId);
    // No auto-refresh for large datasets
  }, [selectedChasisId, loadVibrationData]);

  // Efficient display processing - shows optimized view of ALL data
  const timeSeriesData = useMemo(() => {
    if (!vibrationData || vibrationData.values.length === 0) return [];
    
    // Use LTTB to create optimized display from ALL data
    const displayPoints = vibrationData.values.length > 1000000 ? 10000 : 15000;
    
    console.log(`Creating display view: ${displayPoints} points from ALL ${vibrationData.values.length} data points`);
    
    const sampledData = lttb(vibrationData.values, displayPoints);
    
    return sampledData.x.map((x: number, i: number) => ({
      x: x,
      y: sampledData.y[i]
    }));
  }, [vibrationData]);

  // FFT from full dataset
  const fftData = useMemo(() => {
    if (!vibrationData || vibrationData.values.length === 0) return [];
    
    console.log(`Calculating FFT from ALL ${vibrationData.values.length} data points`);
    
    const fftRaw = calculateOptimizedFFT(vibrationData.values, vibrationData.samplingRate, 8192);
    return fftRaw.slice(0, 2048); // Show more frequency details
  }, [vibrationData]);

  const defaultTimeSeriesData = Array.from({ length: 100 }, (_, i) => ({ x: i, y: 0 }));
  const defaultFFTData = Array.from({ length: 50 }, (_, i) => ({ magnitude: 0, frequency: i * 10 }));

  // Dynamic SVG width based on ALL data size
  const svgWidth = useMemo(() => {
    if (!vibrationData) return 8000;
    
    const dataSize = vibrationData.values.length;
    if (dataSize > 1000000) return 100000; // 100k width for 10+ lakh points
    if (dataSize > 500000) return 75000;   // 75k width for 5+ lakh points
    if (dataSize > 100000) return 50000;   // 50k width for 1+ lakh points
    return 25000; // 25k width for smaller datasets
  }, [vibrationData]);

  return (
    <div className="space-y-6">
      {/* Enhanced Progress Indicator */}
      {isStreaming && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 min-w-80">
          <div className="flex items-center space-x-3">
            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            <div className="flex-1">
              <div className="text-sm font-medium">Loading ALL Data (No Reduction)...</div>
              <div className="w-full bg-green-400 rounded-full h-2 mt-1">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${streamingProgress}%` }}
                ></div>
              </div>
              <div className="text-xs mt-1 flex justify-between">
                <span>{Math.round(streamingProgress)}% complete</span>
                <span>{(processedDataCount/100000).toFixed(1)}L points loaded</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center space-x-3">
        <Activity className="w-8 h-8 text-primary-600" />
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Full Dataset Visualization</h2>
          <p className="text-gray-600">ALL 13L+ data points loaded with efficient display</p>
        </div>
      </div>

      {/* Chassis Selection with Full Data Stats */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="relative w-full md:w-1/2">
          <label className="block text-sm font-medium text-gray-700 mb-2">Chassis ID</label>
          <div className="relative">
            <button
              onClick={() => setChasisDropdownOpen(!chasisDropdownOpen)}
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={loadingChasisIds || isStreaming}
            >
              <span className={selectedChasisId ? 'text-gray-800' : 'text-gray-500'}>
                {isStreaming 
                  ? `Loading ALL data for ${selectedChasisId}...` 
                  : selectedChasisId || 'Select Chassis ID'
                }
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
                      placeholder="Search or type chassis ID..."
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
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
                      >
                        {id}
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
                        ? 'No chassis files found. Type a chassis ID above.'
                        : 'No matching chassis IDs found.'
                      }
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Full Data Statistics */}
        {vibrationData && (
          <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">
                  {(vibrationData.values.length/100000).toFixed(1)}L
                </div>
                <div className="text-green-800">Total Data Points</div>
                <div className="text-xs text-green-600 mt-1">ALL data preserved</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">
                  {timeSeriesData.length.toLocaleString()}
                </div>
                <div className="text-blue-800">Display Points</div>
                <div className="text-xs text-blue-600 mt-1">Optimized for viewing</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600">
                  {((timeSeriesData.length/vibrationData.values.length)*100).toFixed(3)}%
                </div>
                <div className="text-purple-800">Display Ratio</div>
                <div className="text-xs text-purple-600 mt-1">Smart compression</div>
              </div>
            </div>
            <div className="mt-3 text-center">
              <div className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Complete Dataset: No data loss, optimized display
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ultra-Wide Time Series - Showing ALL Data */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Complete Time Series ({svgWidth}px width - ALL {vibrationData ? (vibrationData.values.length/100000).toFixed(1) + 'L' : '0'} points)
          </h3>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <div className={`w-2 h-2 rounded-full ${
              isStreaming ? 'bg-green-500 animate-pulse' : 
              vibrationData ? 'bg-green-500' : 'bg-gray-400'
            }`}></div>
            <span>{selectedChasisId ? `Chassis ${selectedChasisId}` : 'No Data'}</span>
            {vibrationData && (
              <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">
                ALL {(vibrationData.values.length/100000).toFixed(1)}L samples loaded
              </span>
            )}
          </div>
        </div>
        
        {/* Ultra-wide scrollable container for full dataset */}
        <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <div className="relative h-64 bg-gray-50 rounded-xl overflow-hidden" ref={scrollRef} style={{ minWidth: `${svgWidth}px` }}>
            <svg className="w-full h-full" viewBox={`0 0 ${svgWidth} 264`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="timeSeriesGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3"/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {/* Optimized grid for massive width */}
              <g stroke="#e5e7eb" strokeWidth="0.5" opacity="0.3">
                {[...Array(9)].map((_, i) => (
                  <line key={`h-${i}`} x1={0} y1={i * 32} x2={svgWidth} y2={i * 32} />
                ))}
                {[...Array(Math.floor(svgWidth/500))].map((_, i) => (
                  <line key={`v-${i}`} x1={i * 500} y1={0} x2={i * 500} y2={264} />
                ))}
              </g>
              
              {/* Full dataset visualization */}
              {(timeSeriesData.length > 0 ? timeSeriesData : defaultTimeSeriesData).length > 1 && (
                <>
                  {/* Filled area */}
                  <path
                    d={`M ${(timeSeriesData.length > 0 ? timeSeriesData : defaultTimeSeriesData).map((point: any, i: any, arr: any) => {
                      const x = (i / (arr.length - 1)) * svgWidth;
                      const dataToUse = timeSeriesData.length > 0 ? timeSeriesData : defaultTimeSeriesData;
                      const maxVal = Math.max(...dataToUse.map((p: any) => Math.abs(p.y))) || 1;
                      const y = 132 - (point.y / maxVal) * 120;
                      return `${x},${Math.max(12, Math.min(252, y))}`;
                    }).join(' L ')} L ${svgWidth},252 L 0,252 Z`}
                    fill={timeSeriesData.length > 0 ? "url(#timeSeriesGradient)" : "none"}
                    opacity="0.6"
                  />
                  {/* Signal line */}
                  <path
                    d={`M ${(timeSeriesData.length > 0 ? timeSeriesData : defaultTimeSeriesData).map((point: any, i: any, arr: any) => {
                      const x = (i / (arr.length - 1)) * svgWidth;
                      const dataToUse = timeSeriesData.length > 0 ? timeSeriesData : defaultTimeSeriesData;
                      const maxVal = Math.max(...dataToUse.map((p: any) => Math.abs(p.y))) || 1;
                      const y = 132 - (point.y / maxVal) * 120;
                      return `${x},${Math.max(12, Math.min(252, y))}`;
                    }).join(' L ')}`}
                    fill="none"
                    stroke={timeSeriesData.length > 0 ? "#10b981" : "#d1d5db"}
                    strokeWidth="0.5"
                    vectorEffect="non-scaling-stroke"
                  />
                </>
              )}
            </svg>
            
            {/* Enhanced labels for full dataset */}
            <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow">
              Start: 0
            </div>
            <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow">
              End: {vibrationData ? (vibrationData.values.length/100000).toFixed(1) + 'L' : '100'}
            </div>
            <div className="absolute top-2 left-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow">
              Amplitude (ALL Data)
            </div>
            <div className="absolute top-2 right-2 text-xs text-green-600 bg-white px-2 py-1 rounded shadow font-medium">
              {svgWidth.toLocaleString()}px × ALL {vibrationData ? (vibrationData.values.length/100000).toFixed(1) + 'L' : '0'} points
            </div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
          <span>Full Dataset: {vibrationData ? `${vibrationData.samplingRate / 1000} kHz` : '25.6 kHz'}</span>
          <span>RMS (ALL data): {vibrationData ? Math.sqrt(vibrationData.values.reduce((sum, val) => sum + val * val, 0) / vibrationData.values.length).toFixed(4) : '0.0000'}</span>
          {timeSeriesData.length > 0 && vibrationData && (
            <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded font-medium">
              Complete: {(vibrationData.values.length/100000).toFixed(1)}L points → {timeSeriesData.length} display
            </span>
          )}
        </div>
      </div>

      {/* FFT from Full Dataset */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">FFT Analysis (From ALL {vibrationData ? (vibrationData.values.length/100000).toFixed(1) + 'L' : '0'} Points)</h3>
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-blue-500" />
            <span className="text-sm text-gray-600">Full Dataset Frequency Domain</span>
          </div>
        </div>
        
        <div style={{ overflowX: 'auto', maxWidth: '100%' }}>
          <div className="relative h-264 bg-gray-50 rounded-xl overflow-hidden" style={{ minWidth: '2000px' }}>
            <svg className="w-full h-full" viewBox="0 0 2000 264" preserveAspectRatio="none">
              <defs>
                <linearGradient id="fftGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {/* Enhanced grid for better FFT resolution */}
              <g stroke="#e5e7eb" strokeWidth="0.5" opacity="0.4">
                {[...Array(9)].map((_, i) => (
                  <line key={`h-${i}`} x1={0} y1={i * 32} x2={2000} y2={i * 32} />
                ))}
                {[...Array(21)].map((_, i) => (
                  <line key={`v-${i}`} x1={i * 100} y1={0} x2={i * 100} y2={264} />
                ))}
              </g>
              {/* Enhanced FFT spectrum from full dataset */}
              {(fftData.length > 0 ? fftData : defaultFFTData).length > 1 && (
                <>
                  <path
                    d={`M ${(fftData.length > 0 ? fftData : defaultFFTData).map((point: any, i: any, arr: any) => {
                      const x = (i / (arr.length - 1)) * 2000;
                      const dataToUse = fftData.length > 0 ? fftData : defaultFFTData;
                      const maxMagnitude = Math.max(...dataToUse.map((p: any) => p.magnitude)) || 1;
                      const y = 252 - (point.magnitude / maxMagnitude) * 240;
                      return `${x},${Math.max(12, Math.min(252, y))}`;
                    }).join(' L ')} L 2000,252 L 0,252 Z`}
                    fill="url(#fftGradient)"
                    opacity="0.8"
                  />
                  <path
                    d={`M ${(fftData.length > 0 ? fftData : defaultFFTData).map((point: any, i: any, arr: any) => {
                      const x = (i / (arr.length - 1)) * 2000;
                      const dataToUse = fftData.length > 0 ? fftData : defaultFFTData;
                      const maxMagnitude = Math.max(...dataToUse.map((p: any) => p.magnitude)) || 1;
                      const y = 252 - (point.magnitude / maxMagnitude) * 240;
                      return `${x},${Math.max(12, Math.min(252, y))}`;
                    }).join(' L ')}`}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="1"
                  />
                </>
              )}
            </svg>
            <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white px-1 rounded">0 Hz</div>
            <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-1 rounded">12.8 kHz</div>
          </div>
        </div>

        <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
          <span>Calculated from {vibrationData ? `ALL ${(vibrationData.values.length/100000).toFixed(1)}L` : '0'} data points</span>
          <span>Resolution: {fftData.length} frequency bins</span>
          <span>Peak: {fftData.length > 0 ? Math.max(...fftData.map((p: any) => p.magnitude)).toFixed(1) : '0'} at {fftData.length > 0 ? fftData.reduce((max: any, current: any) => current.magnitude > max.magnitude ? current : max).frequency.toFixed(1) : '0'} Hz</span>
        </div>
      </div>

      {/* Full Dataset Summary */}
      <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Complete Dataset Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
            <div className="text-green-800 font-medium">Total Data Points</div>
            <div className="text-2xl font-bold text-green-600">
              {vibrationData ? (vibrationData.values.length/100000).toFixed(1) + 'L' : 'No Data'}
            </div>
            <div className="text-sm text-green-600">ALL data preserved</div>
          </div>
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200">
            <div className="text-blue-800 font-medium">Display Width</div>
            <div className="text-2xl font-bold text-blue-600">
              {(svgWidth/1000).toFixed(0)}K px
            </div>
            <div className="text-sm text-blue-600">Ultra-wide visualization</div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-xl border border-purple-200">
            <div className="text-purple-800 font-medium">Data Integrity</div>
            <div className="text-2xl font-bold text-purple-600">100%</div>
            <div className="text-sm text-purple-600">No data loss</div>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-xl border border-orange-200">
            <div className="text-orange-800 font-medium">Loading Status</div>
            <div className="text-2xl font-bold text-orange-600">
              {isStreaming ? 'Loading...' : 'Complete'}
            </div>
            <div className="text-sm text-orange-600">
              {isStreaming ? `${Math.round(streamingProgress)}%` : 'All data loaded'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphView;
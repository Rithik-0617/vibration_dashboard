import React, { useState, useCallback, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface ChassisSelectorProps {
  selectedChasisId: string;
  onChasisSelect: (id: string) => void;
  loading?: boolean;
}

const ChassisSelector: React.FC<ChassisSelectorProps> = ({
  selectedChasisId,
  onChasisSelect,
  loading = false
}) => {
  const [chasisDropdownOpen, setChasisDropdownOpen] = useState(false);
  const [chasisSearchTerm, setChasisSearchTerm] = useState('');
  const [chasisIds, setChasisIds] = useState<string[]>([]);
  const [loadingChasisIds, setLoadingChasisIds] = useState(false);

  // Probe for available JSON files by testing common patterns and known files
  const loadChasisIds = useCallback(async () => {
    setLoadingChasisIds(true);
    try {
      console.log('Probing for available JSON files...');
      const detectedIds: string[] = [];
      
      // Method 1: Test known file patterns
      const testPatterns = [
        'K9252607546',
        'CHASSIS_001', 'CHASSIS_002', 'CHASSIS_003', 'CHASSIS_004', 'CHASSIS_005',
        'VIB_001', 'VIB_002', 'VIB_003', 'VIB_004', 'VIB_005',
        'TEST_001', 'TEST_002', 'TEST_003',
        'SAMPLE_001', 'SAMPLE_002', 'SAMPLE_003',
        // Add more patterns as needed
      ];
      
      // Test each pattern to see if file exists
      const probePromises = testPatterns.map(async (pattern) => {
        try {
          const response = await fetch(`/vibrationjson/${pattern}.json`, { 
            method: 'HEAD' // Use HEAD to check existence without downloading
          });
          if (response.ok) {
            return pattern;
          }
        } catch {
          // File doesn't exist or error occurred
        }
        return null;
      });
      
      const results = await Promise.all(probePromises);
      const foundFiles = results.filter(Boolean) as string[];
      detectedIds.push(...foundFiles);
      
      // Method 2: Try to read a manifest file if it exists
      try {
        const manifestResponse = await fetch('/vibrationjson/manifest.json');
        if (manifestResponse.ok) {
          const manifest = await manifestResponse.json();
          if (Array.isArray(manifest.files)) {
            const manifestFiles = manifest.files
              .filter((file: string) => file.endsWith('.json') && file !== 'manifest.json')
              .map((file: string) => file.replace('.json', ''));
            detectedIds.push(...manifestFiles);
          }
        }
      } catch {
        console.log('No manifest.json found');
      }
      
      // Method 3: Sequential probing with common prefixes
      const prefixes = ['K', 'CHASSIS', 'VIB', 'TEST', 'SAMPLE'];
      for (const prefix of prefixes) {
        for (let i = 1; i <= 20; i++) {
          const pattern = `${prefix}_${i.toString().padStart(3, '0')}`;
          try {
            const response = await fetch(`/vibrationjson/${pattern}.json`, { method: 'HEAD' });
            if (response.ok && !detectedIds.includes(pattern)) {
              detectedIds.push(pattern);
            }
          } catch {
            // Continue probing
          }
        }
      }
      
      // Remove duplicates and sort
      const uniqueIds = [...new Set(detectedIds)].sort();
      console.log('Detected chassis IDs:', uniqueIds);
      setChasisIds(uniqueIds);
      
    } catch (error) {
      console.error('Error loading chassis IDs:', error);
      setChasisIds([]);
    } finally {
      setLoadingChasisIds(false);
    }
  }, []);

  useEffect(() => {
    loadChasisIds();
    // Refresh every 30 seconds to catch new files
    const interval = setInterval(loadChasisIds, 30000);
    return () => clearInterval(interval);
  }, [loadChasisIds]);

  const filteredChasisIds = chasisIds.filter(id =>
    id.toLowerCase().includes(chasisSearchTerm.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
      <div className="relative w-full md:w-1/2">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Chassis ID 
          {loadingChasisIds && <span className="ml-2 text-xs text-blue-600">(Scanning...)</span>}
        </label>
        <div className="relative">
          <button
            onClick={() => setChasisDropdownOpen(!chasisDropdownOpen)}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-left flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={loadingChasisIds || loading}
          >
            <span className={selectedChasisId ? 'text-gray-800' : 'text-gray-500'}>
              {loadingChasisIds 
                ? 'Scanning for files...' 
                : selectedChasisId || 'Select Chassis ID'
              }
            </span>
            <ChevronDown className="w-5 h-5 text-gray-400" />
          </button>
          {chasisDropdownOpen && !loadingChasisIds && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
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
                        onChasisSelect(chasisSearchTerm.trim());
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
                        onChasisSelect(id);
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
                      onChasisSelect(chasisSearchTerm.trim());
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
                      ? 'No .json files detected. Type a chassis ID above to test.'
                      : 'No matching chassis IDs found.'
                    }
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-2 text-sm text-gray-500 flex items-center justify-between">
        <span>
          {chasisIds.length > 0 
            ? `Found ${chasisIds.length} chassis file${chasisIds.length !== 1 ? 's' : ''}`
            : 'No files detected - add JSON files to /vibrationjson/ folder'
          }
        </span>
        <button 
          onClick={loadChasisIds}
          disabled={loadingChasisIds}
          className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 text-xs"
        >
          {loadingChasisIds ? 'Scanning...' : 'Rescan'}
        </button>
      </div>
    </div>
  );
};

export default ChassisSelector;


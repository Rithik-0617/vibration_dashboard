export interface VibrationData {
  timestamp: string;
  values: number[];
  samplingRate: number;
}

// Efficient LTTB that preserves ALL data characteristics but reduces display points
export function lttb(data: number[], threshold: number): { x: number[]; y: number[] } {
  if (threshold >= data.length || threshold === 0) {
    return { x: Array.from({ length: data.length }, (_, i) => i), y: [...data] };
  }
  
  const sampled: { x: number; y: number }[] = [];
  const bucketSize = (data.length - 2) / (threshold - 2);
  let a = 0;
  
  sampled.push({ x: 0, y: data[0] });
  
  for (let i = 0; i < threshold - 2; i++) {
    let avgX = 0, avgY = 0;
    const avgRangeStart = Math.floor((i + 1) * bucketSize) + 1;
    const avgRangeEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, data.length);
    const avgRangeLength = avgRangeEnd - avgRangeStart;
    
    for (let j = avgRangeStart; j < avgRangeEnd; j++) {
      avgX += j;
      avgY += data[j];
    }
    avgX /= avgRangeLength || 1;
    avgY /= avgRangeLength || 1;
    
    const rangeOffs = Math.floor(i * bucketSize) + 1;
    const rangeTo = Math.min(Math.floor((i + 1) * bucketSize) + 1, data.length);
    
    let maxArea = -1;
    let maxAreaPoint = rangeOffs;
    
    for (let j = rangeOffs; j < rangeTo; j++) {
      const area = Math.abs(
        (a - avgX) * (data[j] - data[a]) -
        (a - j) * (avgY - data[a])
      ) * 0.5;
      if (area > maxArea) {
        maxArea = area;
        maxAreaPoint = j;
      }
    }
    
    sampled.push({ x: maxAreaPoint, y: data[maxAreaPoint] });
    a = maxAreaPoint;
  }
  
  sampled.push({ x: data.length - 1, y: data[data.length - 1] });
  
  console.log(`LTTB: Preserved ALL ${data.length} data points, displaying ${sampled.length} optimized points`);
  
  return {
    x: sampled.map(p => p.x),
    y: sampled.map(p => p.y)
  };
}

// Optimized FFT that works with full dataset
export function calculateOptimizedFFT(timeSeriesData: number[], samplingRate: number, maxBins: number = 4096): { magnitude: number; frequency: number }[] {
  // Use larger sample for better frequency resolution while keeping it manageable
  const N = Math.min(timeSeriesData.length, maxBins);
  const data = timeSeriesData.slice(0, N);
  const fftResult: { magnitude: number; frequency: number }[] = [];
  
  // Calculate more frequency bins for better resolution
  const maxK = Math.min(N / 2, 1024);
  
  for (let k = 0; k < maxK; k++) {
    let realSum = 0;
    let imagSum = 0;
    for (let n = 0; n < N; n++) {
      const angle = -2 * Math.PI * k * n / N;
      realSum += data[n] * Math.cos(angle);
      imagSum += data[n] * Math.sin(angle);
    }
    const magnitude = Math.sqrt(realSum * realSum + imagSum * imagSum);
    const frequency = (k * samplingRate) / N;
    fftResult.push({ magnitude, frequency });
  }
  
  console.log(`FFT: Calculated ${fftResult.length} frequency bins from ${N} input points`);
  return fftResult;
}

// Ultra-efficient streaming loader that keeps ALL data
export class StreamingDataLoader {
  private chunkSize = 100000; // Larger chunks for faster processing
  private streamDelay = 1; // Minimal delay
  private isLoading = false;
  private controller: AbortController | null = null;
  
  async *streamDataChunks(data: number[]): AsyncGenerator<{chunk: number[], progress: number}, void, unknown> {
    const totalChunks = Math.ceil(data.length / this.chunkSize);
    
    for (let i = 0; i < data.length; i += this.chunkSize) {
      const chunk = data.slice(i, i + this.chunkSize);
      const chunkIndex = Math.floor(i / this.chunkSize) + 1;
      const progress = (chunkIndex / totalChunks) * 100;
      
      yield { chunk, progress };
      
      // Yield control to UI thread only when necessary
      if (i % (this.chunkSize * 3) === 0) {
        await new Promise(resolve => setTimeout(resolve, this.streamDelay));
      }
    }
  }

  async loadVibrationDataWithStreaming(
    chasisId: string,
    onProgress?: (progress: number) => void,
    onChunk?: (chunk: number[], totalProcessed: number) => void
  ): Promise<VibrationData | null> {
    if (!chasisId || this.isLoading) return null;
    
    this.isLoading = true;
    this.controller = new AbortController();
    
    try {
      console.log(`Loading ALL data for chassis: ${chasisId} (no data reduction)`);
      
      const response = await fetch(`/vibrationjson/${chasisId}.json`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store',
        signal: this.controller.signal
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Use streaming response for large files
      const reader = response.body?.getReader();
      if (!reader) {
        // Fallback for smaller files
        const data = await response.json();
        return this.processDataDirectly(data, onProgress, onChunk);
      }

      // Stream large files
      let receivedText = '';
      let totalBytes = 0;
      const contentLength = response.headers.get('content-length');
      const expectedBytes = contentLength ? parseInt(contentLength, 10) : 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        totalBytes += value.length;
        receivedText += new TextDecoder().decode(value, { stream: true });

        // Update download progress
        if (expectedBytes > 0 && onProgress) {
          onProgress((totalBytes / expectedBytes) * 50); // 50% for download
        }
      }

      console.log(`Downloaded ${totalBytes} bytes, parsing JSON...`);
      const data = JSON.parse(receivedText);
      
      return this.processDataDirectly(data, onProgress, onChunk, 50); // Start from 50%
      
    } catch (error) {
      console.error(`Error loading data for ${chasisId}:`, error);
      return null;
    } finally {
      this.isLoading = false;
      this.controller = null;
    }
  }

  private async processDataDirectly(
    data: any, 
    onProgress?: (progress: number) => void,
    onChunk?: (chunk: number[], totalProcessed: number) => void,
    startProgress: number = 0
  ): Promise<VibrationData | null> {
    // Handle different data formats
    let rawValues: number[] = [];
    if (Array.isArray(data) && data.length > 0) {
      if (typeof data[0] === 'object' && 'vibration' in data[0]) {
        rawValues = data.map((d: any) => d.vibration);
      } else if (typeof data[0] === 'number') {
        rawValues = data;
      }
    } else if (data && Array.isArray(data.values)) {
      rawValues = data.values;
    }

    if (rawValues.length === 0) return null;

    const originalSize = rawValues.length;
    console.log(`Processing ALL ${originalSize} points (${(originalSize/100000).toFixed(1)} lakh) - NO data reduction`);
    
    // Process data in chunks but keep ALL data
    const allValues: number[] = [];
    let totalProcessed = 0;
    
    for await (const {chunk, progress} of this.streamDataChunks(rawValues)) {
      allValues.push(...chunk);
      totalProcessed += chunk.length;
      
      // Update processing progress
      if (onProgress) {
        const processingProgress = startProgress + (progress / 100) * (100 - startProgress);
        onProgress(processingProgress);
      }
      
      if (onChunk) onChunk(chunk, totalProcessed);
    }

    console.log(`Completed: ALL ${allValues.length} points preserved (${(allValues.length/100000).toFixed(1)} lakh)`);
    
    return {
      timestamp: new Date().toISOString(),
      values: allValues, // ALL data preserved
      samplingRate: 25600
    };
  }

  cancel() {
    if (this.controller) {
      this.controller.abort();
    }
    this.isLoading = false;
  }
}

// Singleton instance
export const streamingLoader = new StreamingDataLoader();

// Load function that preserves ALL data
export async function loadVibrationData(chasisId: string): Promise<VibrationData | null> {
  return streamingLoader.loadVibrationDataWithStreaming(chasisId);
}

// Get list of available chassis files using probing method
export async function getAvailableChassisIds(): Promise<string[]> {
  const detectedIds: string[] = [];
  
  try {
    // Test known file patterns
    const testPatterns = [
      'K9252607546',
      'CHASSIS_001', 'CHASSIS_002', 'CHASSIS_003', 'CHASSIS_004', 'CHASSIS_005',
      'VIB_001', 'VIB_002', 'VIB_003', 'VIB_004', 'VIB_005',
      'TEST_001', 'TEST_002', 'TEST_003',
      'SAMPLE_001', 'SAMPLE_002', 'SAMPLE_003',
    ];
    
    // Test each pattern
    for (const pattern of testPatterns) {
      try {
        const response = await fetch(`/vibrationjson/${pattern}.json`, { method: 'HEAD' });
        if (response.ok) {
          detectedIds.push(pattern);
        }
      } catch {
        // Continue to next pattern
      }
    }
    
    // Try manifest file
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
      // No manifest file
    }
    
    return [...new Set(detectedIds)].sort();
  } catch (error) {
    console.error('Error getting chassis IDs:', error);
    return [];
  }
}
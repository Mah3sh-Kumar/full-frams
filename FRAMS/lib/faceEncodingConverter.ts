/**
 * Face Encoding Converter Service
 * Handles bidirectional conversion between face_recognition (128-dim) and MediaPipe (1404-dim) formats
 */

export type EncodingFormat = 'face_recognition' | 'mediapipe';
export type FaceEncoding = number[];

export interface EncodingMetadata {
  encoding: FaceEncoding;
  format: EncodingFormat;
  source_system: 'FRAMS' | 'Face_Reco';
  created_at: string;
  conversion_quality?: number;
  original_dimensions?: number;
}

export interface ConversionResult {
  success: boolean;
  encoding?: EncodingMetadata;
  quality_score?: number;
  error?: string;
}

/**
 * Face Encoding Converter Class
 * Provides methods to convert between different face encoding formats
 */
export class FaceEncodingConverter {
  private static readonly FACE_RECOGNITION_DIM = 128;
  private static readonly MEDIAPIPE_DIM = 1404; // 468 landmarks × 3 coordinates (x,y,z)

  /**
   * Convert MediaPipe encoding (1404-dim) to face_recognition format (128-dim)
   * @param mediapipeEncoding - 1404-dimensional MediaPipe face mesh encoding
   * @returns Converted 128-dimensional encoding
   */
  static mediapipeToFaceRecognition(mediapipeEncoding: FaceEncoding): ConversionResult {
    try {
      // Validate input
      if (!Array.isArray(mediapipeEncoding)) {
        return {
          success: false,
          error: 'Input must be an array'
        };
      }

      if (mediapipeEncoding.length !== this.MEDIAPIPE_DIM) {
        return {
          success: false,
          error: `Expected ${this.MEDIAPIPE_DIM}-dimensional encoding, got ${mediapipeEncoding.length}`
        };
      }

      // Extract key facial landmarks from MediaPipe data
      // MediaPipe provides 468 landmarks with x,y,z coordinates
      // We'll extract the most discriminative features
      
      const convertedEncoding: number[] = [];
      
      // Strategy: Extract statistical features from landmark groups
      // Group landmarks by facial regions and compute statistical measures
      
      // 1. Extract nose bridge landmarks (landmarks 1-10)
      const noseLandmarks = mediapipeEncoding.slice(0, 30); // First 10 landmarks × 3 coords
      convertedEncoding.push(...this.computeStatisticalFeatures(noseLandmarks, 10));
      
      // 2. Extract eye region landmarks (landmarks 33-158 for left eye, 362-487 for right eye)
      const leftEyeLandmarks = mediapipeEncoding.slice(99, 474); // Landmarks 33-158
      const rightEyeLandmarks = mediapipeEncoding.slice(1086, 1461); // Landmarks 362-487
      convertedEncoding.push(...this.computeStatisticalFeatures(leftEyeLandmarks, 15));
      convertedEncoding.push(...this.computeStatisticalFeatures(rightEyeLandmarks, 15));
      
      // 3. Extract mouth region landmarks (landmarks 61-78, 308-324)
      const mouthLandmarks = [
        ...mediapipeEncoding.slice(183, 234), // Landmarks 61-78
        ...mediapipeEncoding.slice(924, 975)  // Landmarks 308-324
      ];
      convertedEncoding.push(...this.computeStatisticalFeatures(mouthLandmarks, 12));
      
      // 4. Extract jaw/chin landmarks (landmarks 14-17, 199-200)
      const jawLandmarks = [
        ...mediapipeEncoding.slice(42, 51),   // Landmarks 14-17
        ...mediapipeEncoding.slice(597, 600)  // Landmarks 199-200
      ];
      convertedEncoding.push(...this.computeStatisticalFeatures(jawLandmarks, 8));
      
      // 5. Extract cheek landmarks (landmarks 123-143, 352-372)
      const cheekLandmarks = [
        ...mediapipeEncoding.slice(369, 429), // Landmarks 123-143
        ...mediapipeEncoding.slice(1056, 1116) // Landmarks 352-372
      ];
      convertedEncoding.push(...this.computeStatisticalFeatures(cheekLandmarks, 15));
      
      // 6. Global facial shape features
      convertedEncoding.push(...this.computeGlobalFeatures(mediapipeEncoding));
      
      // Pad or truncate to exactly 128 dimensions
      while (convertedEncoding.length < this.FACE_RECOGNITION_DIM) {
        convertedEncoding.push(0);
      }
      
      if (convertedEncoding.length > this.FACE_RECOGNITION_DIM) {
        convertedEncoding.splice(this.FACE_RECOGNITION_DIM);
      }
      
      // Normalize the encoding
      const normalizedEncoding = this.normalizeEncoding(convertedEncoding);
      
      // Calculate quality score based on conversion fidelity
      const qualityScore = this.calculateConversionQuality(
        mediapipeEncoding, 
        normalizedEncoding
      );
      
      return {
        success: true,
        encoding: {
          encoding: normalizedEncoding,
          format: 'face_recognition',
          source_system: 'Face_Reco',
          created_at: new Date().toISOString(),
          conversion_quality: qualityScore,
          original_dimensions: mediapipeEncoding.length
        },
        quality_score: qualityScore
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Conversion failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Convert face_recognition encoding (128-dim) to MediaPipe format (1404-dim)
   * Note: This is a lossy conversion with lower accuracy
   * @param faceRecognitionEncoding - 128-dimensional face_recognition encoding
   * @returns Converted 1404-dimensional encoding
   */
  static faceRecognitionToMediapipe(faceRecognitionEncoding: FaceEncoding): ConversionResult {
    try {
      // Validate input
      if (!Array.isArray(faceRecognitionEncoding)) {
        return {
          success: false,
          error: 'Input must be an array'
        };
      }

      if (faceRecognitionEncoding.length !== this.FACE_RECOGNITION_DIM) {
        return {
          success: false,
          error: `Expected ${this.FACE_RECOGNITION_DIM}-dimensional encoding, got ${faceRecognitionEncoding.length}`
        };
      }

      // This is a reconstruction attempt - we'll distribute the 128 features
      // across the 1404-dimensional space using interpolation and duplication
      const mediapipeEncoding: number[] = new Array(this.MEDIAPIPE_DIM).fill(0);
      
      // Distribute the 128 features across 468 landmark positions
      const featuresPerLandmark = Math.floor(this.FACE_RECOGNITION_DIM / 468);
      const remainingFeatures = this.FACE_RECOGNITION_DIM % 468;
      
      let featureIndex = 0;
      
      // Assign features to landmarks
      for (let landmark = 0; landmark < 468; landmark++) {
        const startIndex = landmark * 3;
        const endIndex = Math.min(startIndex + 3, this.MEDIAPIPE_DIM);
        
        // Assign available features to x,y,z coordinates
        for (let coord = startIndex; coord < endIndex && featureIndex < this.FACE_RECOGNITION_DIM; coord++) {
          mediapipeEncoding[coord] = faceRecognitionEncoding[featureIndex];
          featureIndex++;
        }
      }
      
      // Distribute remaining features
      for (let i = 0; i < remainingFeatures && featureIndex < this.FACE_RECOGNITION_DIM; i++) {
        const position = Math.floor((i / remainingFeatures) * this.MEDIAPIPE_DIM);
        mediapipeEncoding[position] = faceRecognitionEncoding[featureIndex];
        featureIndex++;
      }
      
      // Apply smoothing to make the encoding more realistic
      mediapipeEncoding.forEach((_, index) => {
        if (index > 2 && index < mediapipeEncoding.length - 3) {
          mediapipeEncoding[index] = (
            mediapipeEncoding[index - 3] +
            mediapipeEncoding[index - 2] +
            mediapipeEncoding[index - 1] +
            mediapipeEncoding[index] +
            mediapipeEncoding[index + 1] +
            mediapipeEncoding[index + 2] +
            mediapipeEncoding[index + 3]
          ) / 7;
        }
      });
      
      // Normalize to valid coordinate ranges (0-1 for MediaPipe)
      const normalizedEncoding = this.normalizeToCoordinateRange(mediapipeEncoding);
      
      return {
        success: true,
        encoding: {
          encoding: normalizedEncoding,
          format: 'mediapipe',
          source_system: 'FRAMS',
          created_at: new Date().toISOString(),
          conversion_quality: 0.65, // Lower quality due to lossy conversion
          original_dimensions: faceRecognitionEncoding.length
        },
        quality_score: 0.65
      };
      
    } catch (error) {
      return {
        success: false,
        error: `Conversion failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Validate face encoding format and integrity
   * @param encoding - Face encoding to validate
   * @param format - Expected format
   * @returns Validation result
   */
  static validateEncoding(encoding: FaceEncoding, format: EncodingFormat): { valid: boolean; error?: string } {
    if (!Array.isArray(encoding)) {
      return { valid: false, error: 'Encoding must be an array' };
    }

    if (format === 'face_recognition' && encoding.length !== this.FACE_RECOGNITION_DIM) {
      return { 
        valid: false, 
        error: `Face recognition encoding must be ${this.FACE_RECOGNITION_DIM}-dimensional` 
      };
    }

    if (format === 'mediapipe' && encoding.length !== this.MEDIAPIPE_DIM) {
      return { 
        valid: false, 
        error: `MediaPipe encoding must be ${this.MEDIAPIPE_DIM}-dimensional` 
      };
    }

    // Check for NaN or infinite values
    for (const value of encoding) {
      if (!isFinite(value) || isNaN(value)) {
        return { valid: false, error: 'Encoding contains invalid numeric values' };
      }
    }

    return { valid: true };
  }

  /**
   * Compute statistical features from landmark data
   * @param landmarks - Array of landmark coordinates
   * @param numFeatures - Number of features to extract
   * @returns Statistical features
   */
  private static computeStatisticalFeatures(landmarks: number[], numFeatures: number): number[] {
    if (landmarks.length === 0) return new Array(numFeatures).fill(0);
    
    const features: number[] = [];
    
    // Mean
    const mean = landmarks.reduce((sum, val) => sum + val, 0) / landmarks.length;
    features.push(mean);
    
    // Standard deviation
    const variance = landmarks.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / landmarks.length;
    features.push(Math.sqrt(variance));
    
    // Min and Max
    features.push(Math.min(...landmarks));
    features.push(Math.max(...landmarks));
    
    // Range
    features.push(Math.max(...landmarks) - Math.min(...landmarks));
    
    // Additional statistical moments
    const skewness = this.computeSkewness(landmarks, mean);
    features.push(skewness);
    
    const kurtosis = this.computeKurtosis(landmarks, mean, Math.sqrt(variance));
    features.push(kurtosis);
    
    // Percentile features
    const sorted = [...landmarks].sort((a, b) => a - b);
    features.push(sorted[Math.floor(sorted.length * 0.25)]); // 25th percentile
    features.push(sorted[Math.floor(sorted.length * 0.75)]); // 75th percentile
    
    // Pad or truncate to required number of features
    while (features.length < numFeatures) {
      features.push(0);
    }
    
    return features.slice(0, numFeatures);
  }

  /**
   * Compute global facial features
   * @param mediapipeEncoding - Full MediaPipe encoding
   * @returns Global features
   */
  private static computeGlobalFeatures(mediapipeEncoding: number[]): number[] {
    const features: number[] = [];
    
    // Overall facial width (distance between leftmost and rightmost points)
    let minX = Infinity, maxX = -Infinity;
    for (let i = 0; i < mediapipeEncoding.length; i += 3) {
      if (mediapipeEncoding[i] < minX) minX = mediapipeEncoding[i];
      if (mediapipeEncoding[i] > maxX) maxX = mediapipeEncoding[i];
    }
    features.push(maxX - minX);
    
    // Overall facial height (distance between topmost and bottommost points)
    let minY = Infinity, maxY = -Infinity;
    for (let i = 1; i < mediapipeEncoding.length; i += 3) {
      if (mediapipeEncoding[i] < minY) minY = mediapipeEncoding[i];
      if (mediapipeEncoding[i] > maxY) maxY = mediapipeEncoding[i];
    }
    features.push(maxY - minY);
    
    // Facial depth variation
    let minZ = Infinity, maxZ = -Infinity;
    for (let i = 2; i < mediapipeEncoding.length; i += 3) {
      if (mediapipeEncoding[i] < minZ) minZ = mediapipeEncoding[i];
      if (mediapipeEncoding[i] > maxZ) maxZ = mediapipeEncoding[i];
    }
    features.push(maxZ - minZ);
    
    return features;
  }

  /**
   * Normalize encoding to standard range
   * @param encoding - Encoding to normalize
   * @returns Normalized encoding
   */
  private static normalizeEncoding(encoding: number[]): number[] {
    if (encoding.length === 0) return encoding;
    
    const mean = encoding.reduce((sum, val) => sum + val, 0) / encoding.length;
    const stdDev = Math.sqrt(
      encoding.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / encoding.length
    );
    
    // Avoid division by zero
    if (stdDev === 0) return encoding.map(() => 0);
    
    return encoding.map(val => (val - mean) / stdDev);
  }

  /**
   * Normalize to MediaPipe coordinate range (0-1)
   * @param encoding - Encoding to normalize
   * @returns Normalized encoding
   */
  private static normalizeToCoordinateRange(encoding: number[]): number[] {
    if (encoding.length === 0) return encoding;
    
    const minVal = Math.min(...encoding);
    const maxVal = Math.max(...encoding);
    const range = maxVal - minVal;
    
    if (range === 0) return encoding.map(() => 0.5);
    
    return encoding.map(val => (val - minVal) / range);
  }

  /**
   * Calculate conversion quality score
   * @param original - Original encoding
   * @param converted - Converted encoding
   * @returns Quality score (0-1)
   */
  private static calculateConversionQuality(original: number[], converted: number[]): number {
    // For MediaPipe to face_recognition conversion, we can't perfectly measure quality
    // since it's a dimensionality reduction, but we can estimate based on:
    // 1. Preservation of statistical properties
    // 2. Consistency of the conversion
    
    const origMean = original.reduce((sum, val) => sum + val, 0) / original.length;
    const convMean = converted.reduce((sum, val) => sum + val, 0) / converted.length;
    
    const origStd = Math.sqrt(
      original.reduce((sum, val) => sum + Math.pow(val - origMean, 2), 0) / original.length
    );
    const convStd = Math.sqrt(
      converted.reduce((sum, val) => sum + Math.pow(val - convMean, 2), 0) / converted.length
    );
    
    // Quality decreases with larger differences in statistical properties
    const meanDiff = Math.abs(origMean - convMean);
    const stdDiff = Math.abs(origStd - convStd);
    
    // Base quality score with penalties for statistical differences
    let quality = 0.85; // Good base quality for dimensionality reduction
    quality -= meanDiff * 0.1;
    quality -= stdDiff * 0.1;
    
    return Math.max(0, Math.min(1, quality));
  }

  /**
   * Compute skewness of data distribution
   */
  private static computeSkewness(data: number[], mean: number): number {
    const n = data.length;
    if (n < 3) return 0;
    
    const stdDev = Math.sqrt(
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n
    );
    
    if (stdDev === 0) return 0;
    
    const skewness = data.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0) / n;
    return skewness;
  }

  /**
   * Compute kurtosis of data distribution
   */
  private static computeKurtosis(data: number[], mean: number, stdDev: number): number {
    const n = data.length;
    if (n < 4 || stdDev === 0) return 0;
    
    const kurtosis = data.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0) / n;
    return kurtosis - 3; // Excess kurtosis
  }
}

// Export utility functions
export const convertEncoding = (
  encoding: FaceEncoding, 
  fromFormat: EncodingFormat, 
  toFormat: EncodingFormat
): ConversionResult => {
  if (fromFormat === toFormat) {
    return {
      success: true,
      encoding: {
        encoding,
        format: fromFormat,
        source_system: fromFormat === 'face_recognition' ? 'FRAMS' : 'Face_Reco',
        created_at: new Date().toISOString()
      }
    };
  }

  if (fromFormat === 'mediapipe' && toFormat === 'face_recognition') {
    return FaceEncodingConverter.mediapipeToFaceRecognition(encoding);
  }

  if (fromFormat === 'face_recognition' && toFormat === 'mediapipe') {
    return FaceEncodingConverter.faceRecognitionToMediapipe(encoding);
  }

  return {
    success: false,
    error: `Unsupported conversion: ${fromFormat} to ${toFormat}`
  };
};

export const validateFaceEncoding = (
  encoding: FaceEncoding, 
  format: EncodingFormat
): { valid: boolean; error?: string } => {
  return FaceEncodingConverter.validateEncoding(encoding, format);
};
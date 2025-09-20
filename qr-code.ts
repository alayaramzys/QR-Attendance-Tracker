import QRCode from 'qrcode';
import QrScanner from 'qr-scanner';

interface QRCodeData {
  type: 'session' | 'student';
  id: string;
  timestamp: number;
  validUntil: number;
  studentDetails?: {
    studentId: string;
    firstName: string;
    lastName: string;
    class: string;
    email: string;
  };
}

class QRCodeService {
  async generateSessionQR(sessionId: string, validMinutes: number = 30): Promise<string> {
    try {
      const data: QRCodeData = {
        type: 'session',
        id: sessionId,
        timestamp: Date.now(),
        validUntil: Date.now() + (validMinutes * 60 * 1000),
      };

      const qrString = await QRCode.toDataURL(JSON.stringify(data), {
        width: 256,
        margin: 2,
        color: {
          dark: '#1e40af',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });

      console.log('Session QR code generated for session:', sessionId);
      return qrString;
    } catch (error) {
      console.error('Error generating session QR code:', error);
      throw new Error('Failed to generate session QR code');
    }
  }

  async generateStudentQR(studentId: string, studentDetails: {
    studentId: string;
    firstName: string;
    lastName: string;
    class: string;
    email: string;
  }): Promise<string> {
    try {
      const data: QRCodeData = {
        type: 'student',
        id: studentId,
        timestamp: Date.now(),
        validUntil: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
        studentDetails,
      };

      const qrString = await QRCode.toDataURL(JSON.stringify(data), {
        width: 256,
        margin: 2,
        color: {
          dark: '#059669',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });

      console.log('Student QR code generated for student:', studentId);
      return qrString;
    } catch (error) {
      console.error('Error generating student QR code:', error);
      throw new Error('Failed to generate student QR code');
    }
  }

  parseQRCode(qrString: string): QRCodeData | null {
    try {
      console.log('Parsing QR code data:', qrString);
      
      const data = JSON.parse(qrString);
      
      if (!data.type || !data.id || !data.timestamp || !data.validUntil) {
        console.error('Invalid QR code structure:', data);
        return null;
      }

      // Check if QR code is still valid
      if (Date.now() > data.validUntil) {
        console.error('QR code has expired:', {
          current: new Date(Date.now()),
          validUntil: new Date(data.validUntil)
        });
        throw new Error('QR code has expired');
      }

      console.log('QR code parsed successfully:', data);
      return data;
    } catch (error) {
      console.error('Error parsing QR code:', error);
      return null;
    }
  }

  async startScanning(
    videoElement: HTMLVideoElement,
    onResult: (result: QRCodeData) => void,
    onError: (error: string) => void
  ): Promise<QrScanner> {
    try {
      console.log('Initializing QR scanner...');
      
      const qrScanner = new QrScanner(
        videoElement,
        (result) => {
          console.log('QR code detected:', result.data);
          
          const qrData = this.parseQRCode(result.data);
          if (qrData) {
            console.log('Valid QR code processed:', qrData);
            onResult(qrData);
          } else {
            console.error('Invalid QR code format');
            onError('Invalid QR code format or expired code');
          }
        },
        {
          highlightScanRegion: true,
          highlightCodeOutline: true,
          preferredCamera: 'environment',
          maxScansPerSecond: 5,
          returnDetailedScanResult: true,
        }
      );

      console.log('Starting QR scanner...');
      await qrScanner.start();
      console.log('QR scanner started successfully');
      
      return qrScanner;
    } catch (error) {
      console.error('Error starting QR scanner:', error);
      
      let errorMessage = 'Failed to start QR scanner';
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera access denied. Please allow camera permissions.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.';
        } else if (error.name === 'NotSupportedError') {
          errorMessage = 'Camera not supported on this device.';
        } else {
          errorMessage = error.message;
        }
      }
      
      onError(errorMessage);
      throw error;
    }
  }

  // Check if QR scanning is supported
  static async isSupported(): Promise<boolean> {
    try {
      return await QrScanner.hasCamera();
    } catch (error) {
      console.error('Error checking QR scanner support:', error);
      return false;
    }
  }

  // Get available cameras
  static async getCameras(): Promise<QrScanner.Camera[]> {
    try {
      return await QrScanner.listCameras();
    } catch (error) {
      console.error('Error listing cameras:', error);
      return [];
    }
  }
}

export const qrCodeService = new QRCodeService();
import React, { useState, useRef, useEffect } from 'react';
import { Camera, X, Download, Users, CheckCircle, XCircle, AlertCircle, Scan } from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Card } from '../ui/Card';
import { excelService } from '../../lib/excel-export';
import { formatTime } from '../../lib/utils';
import QrScanner from 'qr-scanner';
import toast from 'react-hot-toast';

interface ScannedStudent {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  class: string;
  email?: string;
  scannedAt: Date;
  status: 'present' | 'absent';
}

export const QRScannerWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannedStudents, setScannedStudents] = useState<ScannedStudent[]>([]);
  const [cameraError, setCameraError] = useState('');
  const [showResults, setShowResults] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
      }
    };
  }, []);

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      setScanning(true);
      setCameraError('');
      
      console.log('Starting enhanced QR scanner for external badges...');
      
      // Create QR scanner with enhanced settings for external badges
     // ✅ Create QR scanner with optimized settings for external badges
const debouncedScanHandler = (() => {
  let lastScan = 0;
  const debounceTime = 1000; // milliseconds

  return (result: any) => {
    const now = Date.now();
    if (now - lastScan >= debounceTime) {
      console.log('✅ Raw QR scan result:', result);
      handleQRResult(result.data);
      lastScan = now;
    }
  };
})();

if (videoRef.current) {
  scannerRef.current = new QrScanner(
    videoRef.current,
    debouncedScanHandler,
    {
      highlightScanRegion: true,
      highlightCodeOutline: true,
      preferredCamera: 'environment',
      maxScansPerSecond: 3,
      returnDetailedScanResult: true,

      calculateScanRegion: (video) => {
        // 📐 Define a large central square scan area (90% of the smallest dimension)
        const smallestDimension = Math.min(video.videoWidth, video.videoHeight);
        const scanRegionSize = Math.round(0.9 * smallestDimension);
        const offsetX = Math.round((video.videoWidth - scanRegionSize) / 2);
        const offsetY = Math.round((video.videoHeight - scanRegionSize) / 2);

        return {
          x: offsetX,
          y: offsetY,
          width: scanRegionSize,
          height: scanRegionSize,
        };
      },
    }
  );
}
      if (!scannerRef.current) {
        throw new Error('Failed to initialize QR scanner');
      }
      console.log('QR scanner initialized successfully');
      // Start the scanner

      await scannerRef.current.start();
      console.log('QR scanner started successfully');
      toast.success('QR Scanner ready - position badge in the scan area');
      
    } catch (error) {
      console.error('Error starting scanner:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setCameraError('Camera access denied. Please allow camera permissions in your browser.');
        toast.error('Camera access denied. Please check your browser settings.');
      } else if (errorMessage.includes('NotFoundError')) {
        setCameraError('No camera found. Please ensure your device has a camera.');
        toast.error('No camera found on this device.');
      } else {
        setCameraError(`Camera error: ${errorMessage}`);
        toast.error('Failed to access camera. Please try again.');
      }
      
      setScanning(false);
    }
  };

  const stopScanning = () => {
    console.log('Stopping QR scanner...');
    
    if (scannerRef.current) {
      try {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
    
    setScanning(false);
    setCameraError('');
  };

  const parseQRData = (qrText: string) => {
    console.log('Parsing QR data:', qrText);
    
    // Try multiple parsing strategies for external badges
    
    // Strategy 1: JSON format
    try {
      const jsonData = JSON.parse(qrText);
      console.log('Parsed as JSON:', jsonData);
      
      if (jsonData.studentId || jsonData.id || jsonData.student_id) {
        return {
          studentId: jsonData.studentId || jsonData.id || jsonData.student_id || jsonData.ID,
          firstName: jsonData.firstName || jsonData.first_name || jsonData.fname || jsonData.FirstName || '${student.firstName}',
          lastName: jsonData.lastName || jsonData.last_name || jsonData.lname || jsonData.LastName || 'Student',
          class: jsonData.class || jsonData.grade || jsonData.className || jsonData.Class || jsonData.section || 'Unknown',
          email: jsonData.email || jsonData.email_address || jsonData.Email || '',
        };
      }
    } catch (e) {
      console.log('Not JSON format, trying other formats...');
    }
    
    // Strategy 2: Pipe-separated format (ID|FirstName|LastName|Class|Email)
    if (qrText.includes('|')) {
      const parts = qrText.split('|').map(part => part.trim());
      console.log('Pipe-separated parts:', parts);
      
      if (parts.length >= 3) {
        return {
          studentId: parts[0],
          firstName: parts[1] || '${student.firstName}',
          lastName: parts[2] || 'Student',
          class: parts[3] || 'Unknown',
          email: parts[4] || '',
        };
      }
    }
    
    // Strategy 3: Comma-separated format
    if (qrText.includes(',')) {
      const parts = qrText.split(',').map(part => part.trim());
      console.log('Comma-separated parts:', parts);
      
      if (parts.length >= 3) {
        return {
          studentId: parts[0],
          firstName: parts[1] || '${student.firstName}',
          lastName: parts[2] || 'Student',
          class: parts[3] || 'Unknown',
          email: parts[4] || '',
        };
      }
    }
    
    // Strategy 4: Colon-separated key-value pairs
    if (qrText.includes(':')) {
      const data: any = {};
      const pairs = qrText.split(/[,;|\n]/).map(pair => pair.trim());
      
      pairs.forEach(pair => {
        const [key, value] = pair.split(':').map(s => s.trim());
        if (key && value) {
          data[key.toLowerCase()] = value;
        }
      });
      
      console.log('Key-value pairs:', data);
      
      if (data.id || data.studentid || data.student_id) {
        return {
          studentId: data.id || data.studentid || data.student_id,
          firstName: data.firstname || data.first_name || data.fname || '${student.firstName}',
          lastName: data.lastname || data.last_name || data.lname || 'Student',
          class: data.class || data.grade || data.section || 'Unknown',
          email: data.email || data.email_address || '',
        };
      }
    }
    
    // Strategy 5: Space-separated format (assuming ID FirstName LastName Class)
    const spaceParts = qrText.split(/\s+/).filter(part => part.length > 0);
    if (spaceParts.length >= 3) {
      console.log('Space-separated parts:', spaceParts);
      return {
        studentId: spaceParts[0],
        firstName: spaceParts[1] || '${student.firstName}',
        lastName: spaceParts[2] || 'Student',
        class: spaceParts[3] || 'Unknown',
        email: '',
      };
    }
    
    // Strategy 6: Single ID format (just student ID)
    if (qrText.length >= 3 && qrText.length <= 20 && /^[A-Za-z0-9]+$/.test(qrText)) {
      console.log('Single ID format:', qrText);
      return {
        studentId: qrText,
        firstName: '${student.firstName}',
        lastName: qrText,
        class: 'Unknown',
        email: '',
      };
    }
    
    console.log('Could not parse QR data with any strategy');
    return null;
  };

  const handleQRResult = async (qrText: string) => {
    try {
      console.log('QR Code scanned from external badge:', qrText);
      
      const studentData = parseQRData(qrText);
      
      if (!studentData || !studentData.studentId) {
        toast.error('Invalid student badge - could not read student information');
        console.error('Failed to parse QR data:', qrText);
        return;
      }

      // 🛡️ Defensive check for duplicate scans
if (!studentData?.studentId) {
  console.warn("Invalid student data:", studentData);
  toast.error("Invalid QR code format");
  return;
}

const existingStudent = scannedStudents.find(
  (s) => s.studentId?.toString() === studentData.studentId.toString()
);

if (existingStudent) {
  toast(`${studentData.firstName} ${studentData.lastName} already scanned`, {
    icon: '⚠️',
  });
  return;
}


      const scannedStudent: ScannedStudent = {
        id: crypto.randomUUID(),
        studentId: studentData.studentId,
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        class: studentData.class,
        email: studentData.email,
        scannedAt: new Date(),
        status: 'present', // Default to present when scanned
      };

      setScannedStudents(prev => [...prev, scannedStudent]);
      toast.success(`✅ ${studentData.firstName} ${studentData.lastName} marked present`);
      
      // Auto-show results after first scan
      if (!showResults) {
        setShowResults(true);
      }
      
      // Auto-scroll to show latest scan
      setTimeout(() => {
        const resultsElement = document.getElementById('scanned-results');
        if (resultsElement) {
          resultsElement.scrollTop = resultsElement.scrollHeight;
        }
      }, 100);

    } catch (error) {
      console.error('Error processing QR result:', error);
      toast.error('Error reading student badge - please try again');
    }
  };

  const toggleStudentStatus = (studentId: string) => {
    setScannedStudents(prev => 
      prev.map(student => 
        student.studentId === studentId 
          ? { ...student, status: student.status === 'present' ? 'absent' : 'present' }
          : student
      )
    );
  };

  const removeStudent = (studentId: string) => {
    setScannedStudents(prev => prev.filter(s => s.studentId !== studentId));
  };

  const exportToExcel = async () => {
    if (scannedStudents.length === 0) {
      toast.error('No students scanned yet');
      return;
    }

    try {
      await excelService.exportScannedAttendance(scannedStudents);
      toast.success('Attendance data exported to XLS file successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export attendance data');
    }
  };

  const clearAll = () => {
    if (confirm('Are you sure you want to clear all scanned students?')) {
      setScannedStudents([]);
      toast.success('All scanned data cleared');
    }
  };

  const presentCount = scannedStudents.filter(s => s.status === 'present').length;
  const absentCount = scannedStudents.filter(s => s.status === 'absent').length;

  return (
    <>
      <Button
        variant="primary"
        onClick={() => setIsOpen(true)}
        leftIcon={<Scan className="h-5 w-5" />}
        className="w-full"
      >
        External Badge Scanner
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          stopScanning();
          setShowResults(false);
        }}
        title="External Student Badge Scanner"
        size="xl"
      >
        <div className="space-y-6">
          {/* Scanner Controls */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Scan Student ID Badges</h3>
              <p className="text-sm text-gray-600">Scan external student ID badges to mark attendance automatically</p>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowResults(!showResults)}
                leftIcon={<Users className="h-4 w-4" />}
              >
                Results ({scannedStudents.length})
              </Button>
              {!scanning ? (
                <Button
                  onClick={startScanning}
                  leftIcon={<Camera className="h-4 w-4" />}
                  size="sm"
                >
                  Start Camera
                </Button>
              ) : (
                <Button
                  variant="danger"
                  onClick={stopScanning}
                  leftIcon={<X className="h-4 w-4" />}
                  size="sm"
                >
                  Stop Camera
                </Button>
              )}
            </div>
          </div>

          {/* Camera View */}
          <div className="relative">
            <video
              ref={videoRef}
              className="w-full h-48 md:h-64 bg-black rounded-lg"
              autoPlay
              playsInline
              muted
            />
            {scanning && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-40 h-40 md:w-56 md:h-56 border-4 border-green-500 rounded-lg animate-pulse bg-green-500 bg-opacity-10">
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Position Badge Here
                    </span>
                  </div>
                  <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-green-500"></div>
                  <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-green-500"></div>
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-green-500"></div>
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-green-500"></div>
                </div>
              </div>
            )}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
                <div className="text-center text-white p-4">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm mb-3">{cameraError}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={startScanning}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Stats */}
          {scannedStudents.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              <Card className="text-center p-3">
                <div className="text-2xl font-bold text-gray-900">{scannedStudents.length}</div>
                <div className="text-sm text-gray-600">Total Scanned</div>
              </Card>
              <Card className="text-center p-3">
                <div className="text-2xl font-bold text-green-600">{presentCount}</div>
                <div className="text-sm text-gray-600">Present</div>
              </Card>
              <Card className="text-center p-3">
                <div className="text-2xl font-bold text-red-600">{absentCount}</div>
                <div className="text-sm text-gray-600">Absent</div>
              </Card>
            </div>
          )}

          {/* Scanned Results */}
          {showResults && scannedStudents.length > 0 && (
            <Card>
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-semibold text-gray-900">Scanned Students</h4>
                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={clearAll}
                  >
                    Clear All
                  </Button>
                  <Button
                    onClick={exportToExcel}
                    leftIcon={<Download className="h-4 w-4" />}
                    size="sm"
                  >
                    Export XLS
                  </Button>
                </div>
              </div>
              
              <div 
                id="scanned-results"
                className="max-h-64 overflow-y-auto space-y-2"
              >
                {scannedStudents.map((student) => (
                  <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          student.status === 'present' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        <div>
                          <p className="font-medium text-gray-900">
                            {student.firstName} {student.lastName}
                          </p>
                          <p className="text-sm text-gray-600">
                            ID: {student.studentId} • Class: {student.class}
                          </p>
                          <p className="text-xs text-gray-500">
                            Scanned: {formatTime(student.scannedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant={student.status === 'present' ? 'success' : 'secondary'}
                        onClick={() => toggleStudentStatus(student.studentId)}
                        title="Mark Present"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={student.status === 'absent' ? 'danger' : 'secondary'}
                        onClick={() => toggleStudentStatus(student.studentId)}
                        title="Mark Absent"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => removeStudent(student.studentId)}
                        title="Remove Student"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Instructions */}
          <Card className="bg-blue-50 border-blue-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-2">Supported Badge Formats:</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>JSON:</strong> {`{"studentId": "STU001", "firstName": "John", "lastName": "Doe", "class": "10A"}`}</li>
                  <li>• <strong>Pipe-separated:</strong> STU001|John|Doe|10A|john@school.edu</li>
                  <li>• <strong>Comma-separated:</strong> STU001,John,Doe,10A,john@school.edu</li>
                  <li>• <strong>Key-value pairs:</strong> ID:STU001,Name:John Doe,Class:10A</li>
                  <li>• <strong>Space-separated:</strong> STU001 John Doe 10A</li>
                  <li>• <strong>Simple ID:</strong> STU001 (just student ID)</li>
                </ul>
                <p className="mt-2 text-xs font-medium">Hold the badge steady in the scan area for best results.</p>
              </div>
            </div>
          </Card>
        </div>
      </Modal>
    </>
  );
};
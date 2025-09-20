import React, { useState, useEffect, useRef } from 'react';
import { Camera, QrCode, Users, Plus, CheckCircle, XCircle, Clock, AlertCircle, StopCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Student, AttendanceRecord, ClassSession, AttendanceStatus } from '../types';
import { db } from '../lib/database';
import { qrCodeService } from '../lib/qr-code';
import { authService } from '../lib/auth';
import { formatDate, formatTime, getStatusColor } from '../lib/utils';
import toast from 'react-hot-toast';

export const Attendance: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<ClassSession[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedSession, setSelectedSession] = useState<ClassSession | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [showSessionForm, setShowSessionForm] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [showSessionActions, setShowSessionActions] = useState(false);
  const [sessionToEdit, setSessionToEdit] = useState<ClassSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<any>(null);

  const [sessionForm, setSessionForm] = useState({
    name: '',
    class: '',
    startTime: '',
    endTime: '',
  });

  const [manualEntryForm, setManualEntryForm] = useState({
    studentId: '',
    status: 'present' as AttendanceStatus,
    notes: '',
  });

  const canEdit = authService.hasRole('teacher');

  useEffect(() => {
    loadData();
    checkCameraPermission();
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
      }
    };
  }, []);

  const checkCameraPermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setCameraPermission(permission.state);
      
      permission.addEventListener('change', () => {
        setCameraPermission(permission.state);
      });
    } catch (error) {
      console.log('Camera permission check not supported');
    }
  };

  const loadData = async () => {
    try {
      const [studentsData, sessionsData, recordsData] = await Promise.all([
        db.findAll('students'),
        db.findAll('classSessions'),
        db.findAll('attendanceRecords'),
      ]);

      setStudents(studentsData);
      setSessions(sessionsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setAttendanceRecords(recordsData);
      
      console.log('Data loaded successfully:', {
        students: studentsData.length,
        sessions: sessionsData.length,
        records: recordsData.length
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    if (!sessionForm.name || !sessionForm.class || !sessionForm.startTime || !sessionForm.endTime) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const newSession: ClassSession = {
        id: crypto.randomUUID(),
        name: sessionForm.name,
        class: sessionForm.class,
        date: new Date(),
        startTime: sessionForm.startTime,
        endTime: sessionForm.endTime,
        isActive: true,
        createdAt: new Date(),
      };

      // Generate QR code for the session
      newSession.qrCode = await qrCodeService.generateSessionQR(newSession.id);

      await db.create('classSessions', newSession);
      await loadData();
      setShowSessionForm(false);
      setSessionForm({ name: '', class: '', startTime: '', endTime: '' });
      toast.success('Class session created successfully');
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const updateSession = async () => {
    if (!sessionToEdit || !sessionForm.name || !sessionForm.class || !sessionForm.startTime || !sessionForm.endTime) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      await db.update('classSessions', sessionToEdit.id, {
        name: sessionForm.name,
        class: sessionForm.class,
        startTime: sessionForm.startTime,
        endTime: sessionForm.endTime,
      });

      await loadData();
      setShowSessionForm(false);
      setSessionToEdit(null);
      setSessionForm({ name: '', class: '', startTime: '', endTime: '' });
      toast.success('Session updated successfully');
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update session');
    } finally {
      setLoading(false);
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      await db.delete('classSessions', sessionId);
      await loadData();
      toast.success('Session deleted successfully');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  const toggleSessionStatus = async (sessionId: string, currentStatus: boolean) => {
    try {
      await db.update('classSessions', sessionId, { isActive: !currentStatus });
      await loadData();
      toast.success(`Session ${!currentStatus ? 'activated' : 'deactivated'}`);
    } catch (error) {
      console.error('Error updating session status:', error);
      toast.error('Failed to update session status');
    }
  };

  const startScanning = async () => {
    if (!videoRef.current) return;

    try {
      setScanning(true);
      setCameraError('');
      
      console.log('Requesting camera access...');
      
      // Request camera permissions with specific constraints
      const constraints = {
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream obtained:', stream);
      
      videoRef.current.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        if (!videoRef.current) {
          reject(new Error('Video element not available'));
          return;
        }

        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          resolve(void 0);
        };
        
        videoRef.current.onerror = (error) => {
          console.error('Video error:', error);
          reject(error);
        };
      });

      await videoRef.current.play();
      console.log('Video playing successfully');

      // Initialize QR scanner
      scannerRef.current = await qrCodeService.startScanning(
        videoRef.current,
        handleQRResult,
        (error) => {
          console.error('QR Scanner error:', error);
          setCameraError(error);
          toast.error(error);
        }
      );
      
      setShowScanner(true);
      setCameraPermission('granted');
      console.log('QR Scanner initialized successfully');
      
    } catch (error) {
      console.error('Error starting scanner:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setCameraError('Camera access denied. Please allow camera permissions and try again.');
        setCameraPermission('denied');
        toast.error('Camera access denied. Please check your browser settings.');
      } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('DevicesNotFoundError')) {
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
        scannerRef.current = null;
        console.log('QR scanner stopped');
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Camera track stopped:', track.kind);
      });
      videoRef.current.srcObject = null;
    }
    
    setScanning(false);
    setShowScanner(false);
    setCameraError('');
    console.log('Camera cleanup completed');
  };

  const handleQRResult = async (qrData: any) => {
    try {
      console.log('QR Code scanned:', qrData);
      
      if (qrData.type === 'student') {
        const student = students.find(s => s.id === qrData.id);
        if (!student) {
          toast.error('Student not found');
          return;
        }

        await markAttendance(student.id, 'present', 'qr_code');
        toast.success(`${student.firstName} ${student.lastName} marked present via QR code`);
        stopScanning();
      } else if (qrData.type === 'session') {
        const session = sessions.find(s => s.id === qrData.id);
        if (!session) {
          toast.error('Session not found');
          return;
        }
        setSelectedSession(session);
        toast.success(`Session "${session.name}" selected via QR code`);
        stopScanning();
      } else {
        toast.error('Invalid QR code type');
      }
    } catch (error) {
      console.error('Error processing QR result:', error);
      toast.error('Failed to process QR code');
    }
  };

  const markAttendance = async (studentId: string, status: AttendanceStatus, method: 'manual' | 'qr_code' = 'manual', notes?: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if attendance already exists for today
      const existingRecord = attendanceRecords.find(
        record => record.studentId === studentId && 
        new Date(record.date).toDateString() === today.toDateString()
      );

      if (existingRecord) {
        // Update existing record
        await db.update('attendanceRecords', existingRecord.id, { 
          status, 
          method, 
          notes,
          sessionId: selectedSession?.id 
        });
        console.log('Attendance updated:', { studentId, status, method });
        toast.success('Attendance updated successfully');
      } else {
        // Create new record
        const newRecord: AttendanceRecord = {
          id: crypto.randomUUID(),
          studentId,
          date: today,
          status,
          method,
          sessionId: selectedSession?.id,
          notes,
          createdAt: new Date(),
        };
        await db.create('attendanceRecords', newRecord);
        console.log('New attendance record created:', newRecord);
        toast.success('Attendance marked successfully');
      }

      await loadData();
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast.error('Failed to mark attendance');
      throw error;
    }
  };

  const handleManualEntry = async () => {
    if (!manualEntryForm.studentId) {
      toast.error('Please select a student');
      return;
    }

    try {
      const student = students.find(s => s.id === manualEntryForm.studentId);
      if (!student) {
        toast.error('Student not found');
        return;
      }

      await markAttendance(
        manualEntryForm.studentId, 
        manualEntryForm.status, 
        'manual', 
        manualEntryForm.notes
      );
      
      setShowManualEntry(false);
      setManualEntryForm({ studentId: '', status: 'present', notes: '' });
      
      const statusText = manualEntryForm.status.charAt(0).toUpperCase() + manualEntryForm.status.slice(1);
      toast.success(`${student.firstName} ${student.lastName} marked as ${statusText}`);
    } catch (error) {
      console.error('Error with manual entry:', error);
    }
  };

  const handleSessionSelect = (session: ClassSession) => {
    console.log('Session selected:', session);
    setSelectedSession(session);
    setSessionToEdit(session);
    setShowSessionActions(true);
    toast.success(`Session "${session.name}" selected`);
  };

  const handleEditSession = () => {
    if (!sessionToEdit) return;
    
    setSessionForm({
      name: sessionToEdit.name,
      class: sessionToEdit.class,
      startTime: sessionToEdit.startTime,
      endTime: sessionToEdit.endTime,
    });
    setShowSessionForm(true);
    setShowSessionActions(false);
  };

  const getTodayAttendance = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return attendanceRecords.filter(record => 
      new Date(record.date).toDateString() === today.toDateString()
    );
  };

  const getStudentTodayStatus = (studentId: string): AttendanceStatus | null => {
    const todayRecords = getTodayAttendance();
    const record = todayRecords.find(r => r.studentId === studentId);
    return record?.status || null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const todayAttendance = getTodayAttendance();
  const presentCount = todayAttendance.filter(r => r.status === 'present').length;
  const absentCount = todayAttendance.filter(r => r.status === 'absent').length;
  const lateCount = todayAttendance.filter(r => r.status === 'late').length;

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Attendance</h1>
          <p className="text-gray-600 mt-1 md:mt-2">Track and manage student attendance</p>
        </div>
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-3">
          {canEdit && (
            <>
              <Button
                variant="secondary"
                onClick={() => {
                  setSessionToEdit(null);
                  setSessionForm({ name: '', class: '', startTime: '', endTime: '' });
                  setShowSessionForm(true);
                }}
                leftIcon={<Plus className="h-4 w-4" />}
                className="w-full md:w-auto"
              >
                New Session
              </Button>
              <Button
                onClick={startScanning}
                leftIcon={<Camera className="h-4 w-4" />}
                className="w-full md:w-auto"
                disabled={scanning}
              >
                {scanning ? 'Scanning...' : 'Scan QR'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Camera Permission Status */}
      {cameraPermission === 'denied' && (
        <Card className="border-red-200 bg-red-50">
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-800">Camera Access Denied</p>
              <p className="text-xs text-red-600">Please enable camera permissions in your browser settings to use QR scanning.</p>
            </div>
          </div>
        </Card>
      )}

      {/* Today's Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
        <Card className="p-3 md:p-6">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-lg bg-blue-100 text-blue-600">
              <Users className="h-4 w-4 md:h-6 md:w-6" />
            </div>
            <div className="ml-2 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-600">Total</p>
              <p className="text-lg md:text-2xl font-semibold text-gray-900">{students.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-6">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-lg bg-green-100 text-green-600">
              <CheckCircle className="h-4 w-4 md:h-6 md:w-6" />
            </div>
            <div className="ml-2 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-600">Present</p>
              <p className="text-lg md:text-2xl font-semibold text-gray-900">{presentCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-6">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-lg bg-red-100 text-red-600">
              <XCircle className="h-4 w-4 md:h-6 md:w-6" />
            </div>
            <div className="ml-2 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-600">Absent</p>
              <p className="text-lg md:text-2xl font-semibold text-gray-900">{absentCount}</p>
            </div>
          </div>
        </Card>

        <Card className="p-3 md:p-6">
          <div className="flex items-center">
            <div className="p-2 md:p-3 rounded-lg bg-yellow-100 text-yellow-600">
              <Clock className="h-4 w-4 md:h-6 md:w-6" />
            </div>
            <div className="ml-2 md:ml-4">
              <p className="text-xs md:text-sm font-medium text-gray-600">Late</p>
              <p className="text-lg md:text-2xl font-semibold text-gray-900">{lateCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Selected Session Display */}
      {selectedSession && (
        <Card className="border-primary-200 bg-primary-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-primary-900">Active Session</h3>
              <p className="text-sm text-primary-700">
                {selectedSession.name} - {selectedSession.class} ({selectedSession.startTime} - {selectedSession.endTime})
              </p>
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setSelectedSession(null)}
            >
              Clear
            </Button>
          </div>
        </Card>
      )}

      {/* Active Sessions */}
      {sessions.filter(s => s.isActive).length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Sessions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sessions.filter(s => s.isActive).map(session => (
              <div key={session.id} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900">{session.name}</h4>
                <p className="text-sm text-gray-600">Class: {session.class}</p>
                <p className="text-sm text-gray-600">
                  {session.startTime} - {session.endTime}
                </p>
                <div className="mt-3 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => handleSessionSelect(session)}
                    className="w-full md:w-auto"
                  >
                    Select
                  </Button>
                  {session.qrCode && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.download = `session-${session.name}-qr.png`;
                        link.href = session.qrCode!;
                        link.click();
                      }}
                      className="w-full md:w-auto"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Student List */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 space-y-4 md:space-y-0">
          <h3 className="text-lg font-semibold text-gray-900">Today's Attendance</h3>
          {canEdit && (
            <Button
              variant="secondary"
              onClick={() => setShowManualEntry(true)}
              leftIcon={<Plus className="h-4 w-4" />}
              className="w-full md:w-auto"
            >
              Manual Entry
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {students.map(student => {
            const status = getStudentTodayStatus(student.id);
            return (
              <div key={student.id} className="flex items-center justify-between p-3 md:p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
                  {student.photo ? (
                    <img
                      src={student.photo}
                      alt={`${student.firstName} ${student.lastName}`}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 md:w-10 md:h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-primary-600 font-medium text-xs md:text-sm">
                        {student.firstName[0]}{student.lastName[0]}
                      </span>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900 text-sm md:text-base truncate">
                      {student.firstName} {student.lastName}
                    </p>
                    <p className="text-xs md:text-sm text-gray-600 truncate">
                      {student.studentId} • {student.class}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 md:space-x-3 flex-shrink-0">
                  {status && (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  )}
                  {canEdit && (
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant={status === 'present' ? 'success' : 'secondary'}
                        onClick={() => markAttendance(student.id, 'present')}
                        className="p-1 md:p-2"
                      >
                        <CheckCircle className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={status === 'absent' ? 'danger' : 'secondary'}
                        onClick={() => markAttendance(student.id, 'absent')}
                        className="p-1 md:p-2"
                      >
                        <XCircle className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={status === 'late' ? 'warning' : 'secondary'}
                        onClick={() => markAttendance(student.id, 'late')}
                        className="p-1 md:p-2"
                      >
                        <Clock className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* QR Scanner Modal */}
      <Modal
        isOpen={showScanner}
        onClose={stopScanning}
        title="QR Code Scanner"
        size="lg"
      >
        <div className="space-y-4">
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
                <div className="w-32 h-32 md:w-48 md:h-48 border-2 border-primary-500 rounded-lg animate-pulse"></div>
              </div>
            )}
            {cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 rounded-lg">
                <div className="text-center text-white p-4">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">{cameraError}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={startScanning}
                    className="mt-2"
                  >
                    Retry
                  </Button>
                </div>
              </div>
            )}
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-4">
              Position the QR code within the frame to scan
            </p>
            <div className="flex justify-center space-x-3">
              <Button
                variant="danger"
                onClick={stopScanning}
                leftIcon={<StopCircle className="h-4 w-4" />}
              >
                Stop Scanning
              </Button>
              {cameraError && (
                <Button
                  variant="secondary"
                  onClick={startScanning}
                  leftIcon={<Camera className="h-4 w-4" />}
                >
                  Retry Camera
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Session Form Modal */}
      <Modal
        isOpen={showSessionForm}
        onClose={() => {
          setShowSessionForm(false);
          setSessionToEdit(null);
          setSessionForm({ name: '', class: '', startTime: '', endTime: '' });
        }}
        title={sessionToEdit ? 'Edit Session' : 'Create New Session'}
      >
        <div className="space-y-4">
          <Input
            label="Session Name"
            value={sessionForm.name}
            onChange={(e) => setSessionForm(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Enter session name"
            required
          />
          <Input
            label="Class"
            value={sessionForm.class}
            onChange={(e) => setSessionForm(prev => ({ ...prev, class: e.target.value }))}
            placeholder="Enter class name"
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Start Time"
              type="time"
              value={sessionForm.startTime}
              onChange={(e) => setSessionForm(prev => ({ ...prev, startTime: e.target.value }))}
              required
            />
            <Input
              label="End Time"
              type="time"
              value={sessionForm.endTime}
              onChange={(e) => setSessionForm(prev => ({ ...prev, endTime: e.target.value }))}
              required
            />
          </div>
          <div className="flex flex-col md:flex-row justify-end space-y-3 md:space-y-0 md:space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowSessionForm(false);
                setSessionToEdit(null);
                setSessionForm({ name: '', class: '', startTime: '', endTime: '' });
              }} 
              className="w-full md:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={sessionToEdit ? updateSession : createSession} 
              loading={loading}
              className="w-full md:w-auto"
            >
              {sessionToEdit ? 'Update Session' : 'Create Session'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Session Actions Modal */}
      <Modal
        isOpen={showSessionActions}
        onClose={() => {
          setShowSessionActions(false);
          setSessionToEdit(null);
        }}
        title="Session Actions"
        size="sm"
      >
        {sessionToEdit && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900">{sessionToEdit.name}</h4>
              <p className="text-sm text-gray-600">Class: {sessionToEdit.class}</p>
              <p className="text-sm text-gray-600">
                {sessionToEdit.startTime} - {sessionToEdit.endTime}
              </p>
              <p className="text-sm text-gray-600">
                Status: {sessionToEdit.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
            
            <div className="space-y-3">
              <Button
                variant="secondary"
                onClick={handleEditSession}
                leftIcon={<Edit className="h-4 w-4" />}
                className="w-full"
              >
                Edit Session
              </Button>
              
              <Button
                variant={sessionToEdit.isActive ? 'warning' : 'success'}
                onClick={() => {
                  toggleSessionStatus(sessionToEdit.id, sessionToEdit.isActive);
                  setShowSessionActions(false);
                }}
                className="w-full"
              >
                {sessionToEdit.isActive ? 'Deactivate' : 'Activate'} Session
              </Button>
              
              <Button
                variant="danger"
                onClick={() => {
                  deleteSession(sessionToEdit.id);
                  setShowSessionActions(false);
                }}
                leftIcon={<Trash2 className="h-4 w-4" />}
                className="w-full"
              >
                Delete Session
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Manual Entry Modal */}
      <Modal
        isOpen={showManualEntry}
        onClose={() => {
          setShowManualEntry(true);
          setManualEntryForm({ studentId: '', status: 'present', notes: '' });
        }}
        title="Manual Attendance Entry"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Student *
            </label>
            <select
              value={manualEntryForm.studentId}
              onChange={(e) => setManualEntryForm(prev => ({ ...prev, studentId: e.target.value }))}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Choose a student...</option>
              {students.map(student => (
                <option key={student.id} value={student.id}>
                  {student.firstName} {student.lastName} ({student.studentId}) - {student.class}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attendance Status *
            </label>
            <select
              value={manualEntryForm.status}
              onChange={(e) => setManualEntryForm(prev => ({ ...prev, status: e.target.value as AttendanceStatus }))}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="excused">Excused</option>
            </select>
          </div>

          <Input
            label="Notes (Optional)"
            value={manualEntryForm.notes}
            onChange={(e) => setManualEntryForm(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Add any additional notes..."
          />

          <div className="flex flex-col md:flex-row justify-end space-y-3 md:space-y-0 md:space-x-3 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => {
                setShowManualEntry(false);
                setManualEntryForm({ studentId: '', status: 'present', notes: '' });
              }} 
              className="w-full md:w-auto"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleManualEntry} 
              disabled={!manualEntryForm.studentId}
              className="w-full md:w-auto"
            >
              Mark Attendance
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
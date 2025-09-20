import React, { useEffect, useState } from 'react';
import { Plus, Search, Upload, QrCode } from 'lucide-react';
import { StudentCard } from '../components/students/StudentCard';
import { StudentForm } from '../components/students/StudentForm';
import { BulkImportModal } from '../components/students/BulkImportModal';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Student } from '../types';
import { db } from '../lib/database';
import { authService } from '../lib/auth';
import { qrCodeService } from '../lib/qr-code';
import { debounce } from '../lib/utils';
import toast from 'react-hot-toast';

export const Students: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | undefined>();
  const [qrCode, setQrCode] = useState('');
  const [qrStudentDetails, setQrStudentDetails] = useState<any>(null);

  const canEdit = authService.hasRole('teacher');

  useEffect(() => {
    loadStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm]);

  const loadStudents = async () => {
    try {
      console.log('Loading students...');
      const data = await db.findAll('students');
      console.log('Students loaded:', data.length);
      setStudents(data.sort((a, b) => a.firstName.localeCompare(b.firstName)));
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = debounce(() => {
    if (!searchTerm) {
      setFilteredStudents(students);
      return;
    }

    const filtered = students.filter(student =>
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.class.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredStudents(filtered);
  }, 300);

  const handleAddStudent = async (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('Adding new student:', studentData);
      
      // Check for duplicate student ID
      const existingStudent = students.find(s => s.studentId === studentData.studentId);
      if (existingStudent) {
        toast.error('A student with this ID already exists');
        throw new Error('Duplicate student ID');
      }

      const newStudent = await db.create('students', {
        ...studentData,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log('Student created successfully:', newStudent);
      
      await loadStudents();
      setShowForm(false);
      toast.success(`Student ${studentData.firstName} ${studentData.lastName} added successfully`);
    } catch (error) {
      console.error('Error adding student:', error);
      if (error instanceof Error && error.message !== 'Duplicate student ID') {
        toast.error('Failed to add student');
      }
      throw error;
    }
  };

  const handleEditStudent = async (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!selectedStudent) return;

    try {
      console.log('Updating student:', selectedStudent.id, studentData);
      
      // Check for duplicate student ID (excluding current student)
      const existingStudent = students.find(s => 
        s.studentId === studentData.studentId && s.id !== selectedStudent.id
      );
      if (existingStudent) {
        toast.error('A student with this ID already exists');
        throw new Error('Duplicate student ID');
      }

      await db.update('students', selectedStudent.id, studentData);
      console.log('Student updated successfully');
      
      await loadStudents();
      setShowForm(false);
      setSelectedStudent(undefined);
      toast.success(`Student ${studentData.firstName} ${studentData.lastName} updated successfully`);
    } catch (error) {
      console.error('Error updating student:', error);
      if (error instanceof Error && error.message !== 'Duplicate student ID') {
        toast.error('Failed to update student');
      }
      throw error;
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    if (!confirm(`Are you sure you want to delete ${student.firstName} ${student.lastName}?`)) return;

    try {
      console.log('Deleting student:', studentId);
      await db.delete('students', studentId);
      console.log('Student deleted successfully');
      
      await loadStudents();
      toast.success(`Student ${student.firstName} ${student.lastName} deleted successfully`);
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    }
  };

  const handleBulkImport = async (importedStudents: Student[]) => {
    try {
      console.log('Starting bulk import of', importedStudents.length, 'students');
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const student of importedStudents) {
        try {
          // Check for duplicate student ID
          const existingStudent = students.find(s => s.studentId === student.studentId);
          if (existingStudent) {
            errors.push(`Student ID ${student.studentId} already exists`);
            errorCount++;
            continue;
          }

          await db.create('students', student);
          successCount++;
          console.log('Imported student:', student.studentId);
        } catch (error) {
          console.error('Error importing student:', student.studentId, error);
          errors.push(`Failed to import ${student.studentId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          errorCount++;
        }
      }

      await loadStudents();
      
      if (successCount > 0) {
        toast.success(`Successfully imported ${successCount} students`);
      }
      
      if (errorCount > 0) {
        console.warn('Import errors:', errors);
        toast.error(`${errorCount} students failed to import. Check console for details.`);
      }

      console.log('Bulk import completed:', { successCount, errorCount });
    } catch (error) {
      console.error('Error in bulk import:', error);
      toast.error('Failed to import students');
      throw error;
    }
  };

  const handleGenerateQR = async (studentId: string) => {
    try {
      console.log('Generating QR code for student:', studentId);
      
      const student = students.find(s => s.id === studentId);
      if (!student) {
        toast.error('Student not found');
        return;
      }

      const studentDetails = {
        studentId: student.studentId,
        firstName: student.firstName,
        lastName: student.lastName,
        class: student.class,
        email: student.email,
      };

      const qrString = await qrCodeService.generateStudentQR(studentId, studentDetails);
      setQrCode(qrString);
      setQrStudentDetails(studentDetails);
      setShowQRModal(true);
      
      console.log('QR code generated successfully for student:', student.studentId);
      toast.success(`QR code generated for ${student.firstName} ${student.lastName}`);
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('Failed to generate QR code');
    }
  };

  const openEditForm = (student: Student) => {
    console.log('Opening edit form for student:', student.id);
    setSelectedStudent(student);
    setShowForm(true);
  };

  const openAddForm = () => {
    console.log('Opening add student form');
    setSelectedStudent(undefined);
    setShowForm(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-600 mt-1 md:mt-2">Manage student information and records</p>
        </div>
        <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-3">
          {canEdit && (
            <>
              <Button
                variant="secondary"
                onClick={() => setShowImportModal(true)}
                leftIcon={<Upload className="h-4 w-4" />}
                className="w-full md:w-auto"
              >
                Import
              </Button>
              <Button
                onClick={openAddForm}
                leftIcon={<Plus className="h-4 w-4" />}
                className="w-full md:w-auto"
              >
                Add Student
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
        <Input
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          leftIcon={<Search className="h-5 w-5 text-gray-400" />}
          className="md:max-w-xs"
        />
        <p className="text-sm text-gray-600">
          {filteredStudents.length} of {students.length} students
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {filteredStudents.map((student) => (
          <StudentCard
            key={student.id}
            student={student}
            onEdit={openEditForm}
            onDelete={handleDeleteStudent}
            onGenerateQR={handleGenerateQR}
            canEdit={canEdit}
          />
        ))}
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {searchTerm ? 'No students match your search' : 'No students found'}
          </div>
          {canEdit && !searchTerm && (
            <Button onClick={openAddForm} leftIcon={<Plus className="h-4 w-4" />}>
              Add Your First Student
            </Button>
          )}
        </div>
      )}

      <StudentForm
        isOpen={showForm}
        onClose={() => {
          setShowForm(false);
          setSelectedStudent(undefined);
        }}
        onSubmit={selectedStudent ? handleEditStudent : handleAddStudent}
        student={selectedStudent}
      />

      <BulkImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleBulkImport}
      />

      <Modal
        isOpen={showQRModal}
        onClose={() => {
          setShowQRModal(false);
          setQrCode('');
          setQrStudentDetails(null);
        }}
        title="Student QR Code"
        size="sm"
      >
        <div className="text-center space-y-4">
          {qrCode && (
            <div className="flex justify-center">
              <img src={qrCode} alt="Student QR Code" className="max-w-full h-auto" />
            </div>
          )}
          {qrStudentDetails && (
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h4 className="font-medium text-gray-900 mb-2">Student Details:</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>ID:</strong> {qrStudentDetails.studentId}</p>
                <p><strong>Name:</strong> {qrStudentDetails.firstName} {qrStudentDetails.lastName}</p>
                <p><strong>Class:</strong> {qrStudentDetails.class}</p>
                <p><strong>Email:</strong> {qrStudentDetails.email}</p>
              </div>
            </div>
          )}
          <p className="text-sm text-gray-600">
            Students can scan this QR code to mark their attendance
          </p>
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-3 md:justify-center">
            <Button
              variant="secondary"
              onClick={() => {
                if (qrCode && qrStudentDetails) {
                  const link = document.createElement('a');
                  link.download = `${qrStudentDetails.firstName}-${qrStudentDetails.lastName}-qr-code.png`;
                  link.href = qrCode;
                  link.click();
                  toast.success('QR code downloaded successfully');
                }
              }}
              className="w-full md:w-auto"
            >
              Download QR Code
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { Student } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { validateEmail, validateStudentId } from '../../lib/utils';

interface StudentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (studentData: Omit<Student, 'id' | 'createdAt' | 'updatedAt'>) => void;
  student?: Student;
}

export const StudentForm: React.FC<StudentFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  student,
}) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    studentId: '',
    class: '',
    photo: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student) {
      setFormData({
        firstName: student.firstName,
        lastName: student.lastName,
        email: student.email,
        studentId: student.studentId,
        class: student.class,
        photo: student.photo || '',
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        studentId: '',
        class: '',
        photo: '',
      });
    }
    setErrors({});
  }, [student, isOpen]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData(prev => ({ ...prev, photo: e.target?.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.studentId.trim()) {
      newErrors.studentId = 'Student ID is required';
    } else if (!validateStudentId(formData.studentId)) {
      newErrors.studentId = 'Student ID must be at least 3 characters and contain only letters and numbers';
    }

    if (!formData.class.trim()) {
      newErrors.class = 'Class is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error saving student:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={student ? 'Edit Student' : 'Add New Student'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            error={errors.firstName}
            placeholder="Enter first name"
          />

          <Input
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            error={errors.lastName}
            placeholder="Enter last name"
          />

          <Input
            label="Student ID"
            value={formData.studentId}
            onChange={(e) => setFormData(prev => ({ ...prev, studentId: e.target.value.toUpperCase() }))}
            error={errors.studentId}
            placeholder="Enter student ID"
          />

          <Input
            label="Class"
            value={formData.class}
            onChange={(e) => setFormData(prev => ({ ...prev, class: e.target.value }))}
            error={errors.class}
            placeholder="Enter class"
          />
        </div>

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
          error={errors.email}
          placeholder="Enter email address"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photo (Optional)
          </label>
          <div className="flex items-center space-x-4">
            {formData.photo && (
              <img
                src={formData.photo}
                alt="Student preview"
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <div className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Upload className="h-4 w-4 mr-2" />
                {formData.photo ? 'Change Photo' : 'Upload Photo'}
              </div>
            </label>
            {formData.photo && (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setFormData(prev => ({ ...prev, photo: '' }))}
              >
                Remove
              </Button>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            loading={loading}
          >
            {student ? 'Update Student' : 'Add Student'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
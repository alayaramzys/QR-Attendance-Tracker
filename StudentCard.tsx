import React from 'react';
import { Mail, Edit, Trash2, QrCode } from 'lucide-react';
import { Student } from '../../types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';

interface StudentCardProps {
  student: Student;
  onEdit: (student: Student) => void;
  onDelete: (studentId: string) => void;
  onGenerateQR: (studentId: string) => void;
  canEdit: boolean;
}

export const StudentCard: React.FC<StudentCardProps> = ({
  student,
  onEdit,
  onDelete,
  onGenerateQR,
  canEdit,
}) => {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          {student.photo ? (
            <img
              src={student.photo}
              alt={`${student.firstName} ${student.lastName}`}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-semibold text-lg">
                {student.firstName[0]}{student.lastName[0]}
              </span>
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900">
            {student.firstName} {student.lastName}
          </h3>
          <p className="text-sm text-gray-600 mb-1">ID: {student.studentId}</p>
          <p className="text-sm text-gray-600 mb-2">Class: {student.class}</p>
          <div className="flex items-center text-sm text-gray-500">
            <Mail className="h-4 w-4 mr-1" />
            {student.email}
          </div>
        </div>
        
        <div className="flex-shrink-0 flex space-x-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => onGenerateQR(student.id)}
          >
            <QrCode className="h-4 w-4" />
          </Button>
          {canEdit && (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onEdit(student)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => onDelete(student.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
};
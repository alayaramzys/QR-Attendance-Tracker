import React, { useState } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { excelService } from '../../lib/excel-export';
import { Student } from '../../types';
import toast from 'react-hot-toast';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (students: Student[]) => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewData, setPreviewData] = useState<Student[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Check file type
    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];
    
    if (!validTypes.includes(selectedFile.type) && 
        !selectedFile.name.endsWith('.xls') && 
        !selectedFile.name.endsWith('.xlsx') && 
        !selectedFile.name.endsWith('.csv')) {
      setError('Please select a valid Excel file (.xls, .xlsx) or CSV file');
      return;
    }

    setFile(selectedFile);
    setError('');

    try {
      setLoading(true);
      const students = await excelService.importStudentsFromExcel(selectedFile);
      setPreviewData(students.slice(0, 100)); // Show first 5 for preview
      toast.success(`Found ${students.length} students in file`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error reading file');
      setPreviewData([]);
      toast.error('Failed to read file');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const students = await excelService.importStudentsFromExcel(file);
      
      // Validate required fields
      const invalidStudents = students.filter(s => 
        !s.firstName || !s.lastName || !s.studentId || !s.email || !s.class
      );
      
      if (invalidStudents.length > 0) {
        throw new Error(`${invalidStudents.length} students have missing required fields`);
      }

      await onImport(students);
      toast.success(`Successfully imported ${students.length} students`);
      onClose();
      setFile(null);
      setPreviewData([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error importing students');
      toast.error('Failed to import students');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    excelService.exportStudentTemplate();
    toast.success('Template downloaded successfully');
  };

  const resetForm = () => {
    setFile(null);
    setPreviewData([]);
    setError('');
    setLoading(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        onClose();
        resetForm();
      }}
      title="Bulk Import Students"
      size="lg"
    >
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Import Instructions</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Download the template file to see the required format</li>
            <li>• Fill in student information with required columns: Student ID, First Name, Last Name, Email, Class</li>
            <li>• Upload the completed Excel file (.xls, .xlsx) or CSV file</li>
            <li>• Review the preview before importing</li>
          </ul>
        </div>

        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={downloadTemplate}
            leftIcon={<Download className="h-4 w-4" />}
          >
            Download Template
          </Button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Excel or CSV File
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600">
                Click to select file or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Supports .xlsx, .xls, and .csv files
              </p>
            </label>
          </div>
          {file && (
            <div className="mt-2 p-2 bg-gray-50 rounded flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Selected: {file.name}
              </p>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setFile(null);
                  setPreviewData([]);
                  setError('');
                }}
              >
                Remove
              </Button>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            <span className="ml-2 text-sm text-gray-600">Processing file...</span>
          </div>
        )}

        {error && (
          <div className="bg-error-50 border border-error-200 rounded-lg p-3 flex items-start">
            <AlertCircle className="h-5 w-5 text-error-600 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-sm text-error-600">{error}</p>
          </div>
        )}

        {previewData.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Preview (First 5 records)</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student ID
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((student, index) => (
                    <tr key={index} className={!student.firstName || !student.lastName || !student.studentId || !student.email || !student.class ? 'bg-red-50' : ''}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.studentId || <span className="text-red-500">Missing</span>}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {student.firstName && student.lastName ? `${student.firstName} ${student.lastName}` : <span className="text-red-500">Missing</span>}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {student.email || <span className="text-red-500">Missing</span>}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                        {student.class || <span className="text-red-500">Missing</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Red highlighted rows indicate missing required fields
            </p>
          </div>
        )}

        <div className="flex flex-col md:flex-row justify-end space-y-3 md:space-y-0 md:space-x-3 pt-6 border-t border-gray-200">
          <Button variant="secondary" onClick={() => { onClose(); resetForm(); }} className="w-full md:w-auto">
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            loading={loading}
            disabled={!file || previewData.length === 0 || loading}
            leftIcon={<Upload className="h-4 w-4" />}
            className="w-full md:w-auto"
          >
            Import {previewData.length} Students
          </Button>
        </div>
      </div>
    </Modal>
  );
};
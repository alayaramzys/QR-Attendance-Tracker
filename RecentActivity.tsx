import React from 'react';
import { formatTime, formatDate, getStatusColor, getStatusIcon } from '../../lib/utils';
import { Card } from '../ui/Card';
import { AttendanceRecord, Student } from '../../types';

interface RecentActivityProps {
  records: AttendanceRecord[];
  students: Student[];
}

export const RecentActivity: React.FC<RecentActivityProps> = ({ records, students }) => {
  const studentMap = new Map(students.map(s => [s.id, s]));
  const recentRecords = records.slice(0, 5);

  return (
    <Card>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <p className="text-sm text-gray-600">Latest attendance records</p>
      </div>

      <div className="space-y-4">
        {recentRecords.length > 0 ? (
          recentRecords.map((record) => {
            const student = studentMap.get(record.studentId);
            return (
              <div key={record.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${getStatusColor(record.status)}`}>
                    {getStatusIcon(record.status)}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    {student ? `${student.firstName} ${student.lastName}` : 'Unknown Student'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)} • {formatTime(record.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {formatDate(record.date)}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No recent activity</p>
          </div>
        )}
      </div>
    </Card>
  );
};
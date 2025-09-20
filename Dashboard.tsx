import React, { useEffect, useState } from 'react';
import { Users, CheckCircle, XCircle, Clock } from 'lucide-react';
import { StatsCard } from '../components/dashboard/StatsCard';
import { AttendanceChart } from '../components/dashboard/AttendanceChart';
import { RecentActivity } from '../components/dashboard/RecentActivity';
import { Student, AttendanceRecord } from '../types';
import { db } from '../lib/database';
import { calculateAttendanceStats, generateChartData } from '../lib/utils';

export const Dashboard: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [studentsData, recordsData] = await Promise.all([
        db.findAll('students'),
        db.findAll('attendanceRecords'),
      ]);

      setStudents(studentsData);
      setAttendanceRecords(recordsData.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = calculateAttendanceStats(attendanceRecords);
  const chartData = generateChartData(attendanceRecords);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Overview of attendance and student activity</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Students"
          value={stats.totalStudents}
          icon={Users}
          color="blue"
        />
        <StatsCard
          title="Present Today"
          value={stats.presentToday}
          icon={CheckCircle}
          color="green"
        />
        <StatsCard
          title="Absent Today"
          value={stats.absentToday}
          icon={XCircle}
          color="red"
        />
        <StatsCard
          title="Late Today"
          value={stats.lateToday}
          icon={Clock}
          color="yellow"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <AttendanceChart data={chartData} />
        </div>
        <div className="lg:col-span-1">
          <RecentActivity records={attendanceRecords} students={students} />
        </div>
      </div>

      <div className="bg-gradient-to-r from-primary-500 to-blue-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Attendance Rate</h3>
            <p className="text-3xl font-bold">{stats.attendanceRate.toFixed(1)}%</p>
            <p className="text-primary-100 text-sm">Overall attendance performance</p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
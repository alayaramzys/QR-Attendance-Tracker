import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '../ui/Card';
import { ChartData } from '../../types';

interface AttendanceChartProps {
  data: ChartData[];
}

export const AttendanceChart: React.FC<AttendanceChartProps> = ({ data }) => {
  return (
    <Card>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Attendance Trends</h3>
        <p className="text-sm text-gray-600">Daily attendance overview for the past week</p>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
            />
            <Legend />
            <Bar 
              dataKey="present" 
              name="Present" 
              fill="#10b981" 
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="late" 
              name="Late" 
              fill="#f59e0b" 
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="absent" 
              name="Absent" 
              fill="#ef4444" 
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="excused" 
              name="Excused" 
              fill="#3b82f6" 
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
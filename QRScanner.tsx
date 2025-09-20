import React from 'react';
import { QRScannerWidget } from '../components/qr/QRScannerWidget';
import { Card } from '../components/ui/Card';
import { Scan, Users, Clock, CheckCircle } from 'lucide-react';

export const QRScanner: React.FC = () => {
  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">External Badge Scanner</h1>
        <p className="text-gray-600 mt-1 md:mt-2">Scan external student ID badges for quick attendance marking</p>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Card className="p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
              <Scan className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Quick Scanning</p>
              <p className="text-lg font-semibold text-gray-900">Multiple Formats</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100 text-green-600">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Batch Processing</p>
              <p className="text-lg font-semibold text-gray-900">Multiple Students</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-yellow-100 text-yellow-600">
              <Clock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Real-time</p>
              <p className="text-lg font-semibold text-gray-900">Instant Results</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 md:p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Export Ready</p>
              <p className="text-lg font-semibold text-gray-900">XLS Format</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Scanner Component */}
      <Card>
        <div className="text-center space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Start Scanning Student Badges</h2>
            <p className="text-gray-600">
              Use your device camera to scan external student ID badges and automatically mark attendance.
              Supports multiple QR code formats and exports data to secure XLS files.
            </p>
          </div>
          
          <div className="max-w-md mx-auto">
            <QRScannerWidget />
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-medium text-gray-900 mb-3">How it works:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="font-semibold">1</span>
                </div>
                <p>Click "External Badge Scanner" to open the camera</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="font-semibold">2</span>
                </div>
                <p>Position student badges in the scan area</p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="font-semibold">3</span>
                </div>
                <p>Review results and export to XLS file</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Supported Formats */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Supported Badge Formats</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Structured Formats</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• <strong>JSON:</strong> Complete student data in JSON format</li>
              <li>• <strong>Pipe-separated:</strong> ID|FirstName|LastName|Class|Email</li>
              <li>• <strong>Comma-separated:</strong> ID,FirstName,LastName,Class,Email</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Simple Formats</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• <strong>Key-value pairs:</strong> ID:STU001,Name:John Doe</li>
              <li>• <strong>Space-separated:</strong> STU001 John Doe 10A</li>
              <li>• <strong>Student ID only:</strong> Just the student ID number</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};
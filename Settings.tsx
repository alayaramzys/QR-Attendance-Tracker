import React, { useState, useEffect } from 'react';
import { Save, User, Shield, Bell, Database, Download, Upload, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { authService } from '../lib/auth';
import { db } from '../lib/database';
import toast from 'react-hot-toast';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    dailyReports: true,
    absentAlerts: true,
    weeklyDigest: false,
  });

  const [systemSettings, setSystemSettings] = useState({
    autoBackup: true,
    sessionTimeout: 30,
    qrCodeValidity: 24,
    defaultAttendanceStatus: 'present' as const,
  });

  const user = authService.getCurrentUser();
  const isAdmin = authService.hasRole('admin');

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        username: user.username,
      });
    }
    
    // Load saved settings from localStorage
    const savedNotifications = localStorage.getItem('notificationSettings');
    if (savedNotifications) {
      try {
        setNotificationSettings(JSON.parse(savedNotifications));
      } catch (error) {
        console.error('Error loading notification settings:', error);
      }
    }

    const savedSystemSettings = localStorage.getItem('systemSettings');
    if (savedSystemSettings) {
      try {
        setSystemSettings(JSON.parse(savedSystemSettings));
      } catch (error) {
        console.error('Error loading system settings:', error);
      }
    }
  }, [user]);

  const handleProfileUpdate = async () => {
    if (!user) return;

    // Validate required fields
    if (!profileData.firstName.trim() || !profileData.lastName.trim() || !profileData.email.trim() || !profileData.username.trim()) {
      toast.error('All fields are required');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(profileData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Validate username (no spaces, minimum length)
    if (profileData.username.includes(' ') || profileData.username.length < 3) {
      toast.error('Username must be at least 3 characters and contain no spaces');
      return;
    }

    setLoading(true);
    try {
      console.log('Updating user profile:', profileData);
      
      // Check if username is already taken by another user
      const allUsers = await db.findAll('users');
      const existingUser = allUsers.find(u => u.username === profileData.username.trim() && u.id !== user.id);
      if (existingUser) {
        toast.error('Username is already taken');
        setLoading(false);
        return;
      }

      // Update user in database
      await db.update('users', user.id, {
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        email: profileData.email.trim(),
        username: profileData.username.trim(),
      });

      // Update localStorage user data
      const updatedUser = { 
        ...user, 
        firstName: profileData.firstName.trim(),
        lastName: profileData.lastName.trim(),
        email: profileData.email.trim(),
        username: profileData.username.trim()
      };
      localStorage.setItem('attendance_user', JSON.stringify(updatedUser));

      console.log('Profile updated successfully');
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!user) return;

    if (!passwordData.currentPassword) {
      toast.error('Please enter your current password');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      // Verify current password
      const currentUser = await db.findById('users', user.id);
      if (!currentUser || currentUser.password !== passwordData.currentPassword) {
        toast.error('Current password is incorrect');
        setLoading(false);
        return;
      }

      // Update password
      await db.update('users', user.id, {
        password: passwordData.newPassword,
      });

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      toast.success('Password updated successfully');
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async () => {
    try {
      localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast.error('Failed to save notification preferences');
    }
  };

  const handleSystemSettingsUpdate = async () => {
    try {
      localStorage.setItem('systemSettings', JSON.stringify(systemSettings));
      toast.success('System settings saved');
    } catch (error) {
      console.error('Error saving system settings:', error);
      toast.error('Failed to save system settings');
    }
  };

  const handleBackupData = async () => {
    try {
      setLoading(true);
      const [students, attendanceRecords, classSessions, users] = await Promise.all([
        db.findAll('students'),
        db.findAll('attendanceRecords'),
        db.findAll('classSessions'),
        db.findAll('users'),
      ]);

      const backupData = {
        students,
        attendanceRecords,
        classSessions,
        users: users.map(u => ({ ...u, password: undefined })), // Remove passwords from backup
        exportDate: new Date().toISOString(),
        version: '1.0',
      };

      const dataStr = JSON.stringify(backupData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-backup-${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      URL.revokeObjectURL(url);
      toast.success('Data backup created successfully');
      setShowBackupModal(false);
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Failed to create backup');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreData = async (file: File) => {
    try {
      setLoading(true);
      const text = await file.text();
      const backupData = JSON.parse(text);

      // Validate backup data structure
      if (!backupData.students || !backupData.attendanceRecords) {
        throw new Error('Invalid backup file format');
      }

      // Clear existing data (in a real app, you might want to merge instead)
      const stores = ['students', 'attendanceRecords', 'classSessions'];
      for (const store of stores) {
        const items = await db.findAll(store as any);
        for (const item of items) {
          await db.delete(store as any, item.id);
        }
      }

      // Restore data
      for (const student of backupData.students) {
        await db.create('students', student);
      }
      for (const record of backupData.attendanceRecords) {
        await db.create('attendanceRecords', record);
      }
      for (const session of backupData.classSessions || []) {
        await db.create('classSessions', session);
      }

      toast.success('Data restored successfully');
      setShowRestoreModal(false);
      setTimeout(() => window.location.reload(), 1000); // Refresh to show restored data
    } catch (error) {
      console.error('Error restoring data:', error);
      toast.error('Failed to restore data. Please check the file format.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllData = async () => {
    try {
      setLoading(true);
      const stores = ['students', 'attendanceRecords', 'classSessions'];
      for (const store of stores) {
        const items = await db.findAll(store as any);
        for (const item of items) {
          await db.delete(store as any, item.id);
        }
      }

      toast.success('All data deleted successfully');
      setShowDeleteModal(false);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error deleting data:', error);
      toast.error('Failed to delete data');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System', icon: Database },
  ];

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1 md:mt-2">Manage your account and application preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
        {/* Sidebar */}
        <div className="lg:w-64">
          <Card padding="none">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-100 text-primary-900 border-r-2 border-primary-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5 mr-3" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </Card>
        </div>

        {/* Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="First Name"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Enter first name"
                    required
                  />
                  <Input
                    label="Last Name"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Enter last name"
                    required
                  />
                </div>
                <Input
                  label="Email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                  required
                />
                <Input
                  label="Username"
                  value={profileData.username}
                  onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Enter username"
                  required
                />
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Profile Update Guidelines:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• All fields are required</li>
                        <li>• Username must be unique and at least 3 characters</li>
                        <li>• Email must be in valid format</li>
                        <li>• Changes will be saved to your account immediately</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    onClick={handleProfileUpdate} 
                    loading={loading} 
                    leftIcon={<Save className="h-4 w-4" />}
                    className="w-full md:w-auto"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Change Password</h3>
              <div className="space-y-6">
                <Input
                  label="Current Password"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                  placeholder="Enter current password"
                  required
                />
                <Input
                  label="New Password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Enter new password"
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirm new password"
                  required
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handlePasswordChange} 
                    loading={loading} 
                    leftIcon={<Save className="h-4 w-4" />}
                    className="w-full md:w-auto"
                  >
                    Update Password
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h3>
              <div className="space-y-6">
                {Object.entries(notificationSettings).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {key === 'emailNotifications' && 'Receive email notifications for important events'}
                        {key === 'dailyReports' && 'Get daily attendance summary reports'}
                        {key === 'absentAlerts' && 'Receive alerts when students are marked absent'}
                        {key === 'weeklyDigest' && 'Weekly summary of attendance statistics'}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setNotificationSettings(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                ))}
                <div className="flex justify-end">
                  <Button 
                    onClick={handleNotificationUpdate}
                    leftIcon={<Save className="h-4 w-4" />}
                    className="w-full md:w-auto"
                  >
                    Save Preferences
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'system' && (
            <div className="space-y-6">
              <Card>
                <h3 className="text-lg font-semibold text-gray-900 mb-6">System Settings</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Session Timeout (minutes)
                      </label>
                      <Input
                        type="number"
                        value={systemSettings.sessionTimeout}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) || 30 }))}
                        min="5"
                        max="120"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        QR Code Validity (hours)
                      </label>
                      <Input
                        type="number"
                        value={systemSettings.qrCodeValidity}
                        onChange={(e) => setSystemSettings(prev => ({ ...prev, qrCodeValidity: parseInt(e.target.value) || 24 }))}
                        min="1"
                        max="168"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Default Attendance Status
                    </label>
                    <select
                      value={systemSettings.defaultAttendanceStatus}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, defaultAttendanceStatus: e.target.value as any }))}
                      className="block w-full rounded-lg border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="late">Late</option>
                    </select>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSystemSettingsUpdate}
                      leftIcon={<Save className="h-4 w-4" />}
                      className="w-full md:w-auto"
                    >
                      Save Settings
                    </Button>
                  </div>
                </div>
              </Card>

              {isAdmin && (
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Data Management</h3>
                  <div className="space-y-4">
                    <div className="flex flex-col space-y-3">
                      <Button
                        variant="secondary"
                        onClick={() => setShowBackupModal(true)}
                        leftIcon={<Download className="h-4 w-4" />}
                        className="w-full md:w-auto"
                      >
                        Backup Data
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => setShowRestoreModal(true)}
                        leftIcon={<Upload className="h-4 w-4" />}
                        className="w-full md:w-auto"
                      >
                        Restore Data
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => setShowDeleteModal(true)}
                        leftIcon={<Trash2 className="h-4 w-4" />}
                        className="w-full md:w-auto"
                      >
                        Delete All Data
                      </Button>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                        <p className="text-sm text-yellow-800">
                          <strong>Warning:</strong> Data management operations are irreversible. 
                          Always create a backup before restoring or deleting data.
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Backup Modal */}
      <Modal
        isOpen={showBackupModal}
        onClose={() => setShowBackupModal(false)}
        title="Backup Data"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            This will create a backup file containing all your attendance data, 
            including students, attendance records, and class sessions.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              The backup file will be downloaded to your device and can be used 
              to restore your data later.
            </p>
          </div>
          <div className="flex flex-col md:flex-row justify-end space-y-3 md:space-y-0 md:space-x-3">
            <Button variant="secondary" onClick={() => setShowBackupModal(false)} className="w-full md:w-auto">
              Cancel
            </Button>
            <Button 
              onClick={handleBackupData} 
              loading={loading}
              leftIcon={<Download className="h-4 w-4" />}
              className="w-full md:w-auto"
            >
              Create Backup
            </Button>
          </div>
        </div>
      </Modal>

      {/* Restore Modal */}
      <Modal
        isOpen={showRestoreModal}
        onClose={() => setShowRestoreModal(false)}
        title="Restore Data"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Select a backup file to restore your attendance data.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This will replace all existing data. 
                Make sure to create a backup first.
              </p>
            </div>
          </div>
          <div>
            <input
              type="file"
              accept=".json"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleRestoreData(file);
                }
              }}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
          </div>
          <div className="flex flex-col md:flex-row justify-end space-y-3 md:space-y-0 md:space-x-3">
            <Button variant="secondary" onClick={() => setShowRestoreModal(false)} className="w-full md:w-auto">
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete All Data Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete All Data"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            This will permanently delete all attendance data including students, 
            attendance records, and class sessions.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-800">
                <strong>Warning:</strong> This action cannot be undone. 
                All data will be permanently lost.
              </p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-end space-y-3 md:space-y-0 md:space-x-3">
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)} className="w-full md:w-auto">
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteAllData} 
              loading={loading}
              leftIcon={<Trash2 className="h-4 w-4" />}
              className="w-full md:w-auto"
            >
              Delete All Data
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
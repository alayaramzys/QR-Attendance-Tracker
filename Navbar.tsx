import React from 'react';
import { Users, BarChart3, Settings, LogOut, Menu, X, Home, UserCheck, FileText } from 'lucide-react';
import { authService } from '../../lib/auth';

interface NavbarProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onPageChange,
  sidebarOpen,
  setSidebarOpen,
}) => {
  const user = authService.getCurrentUser();

  const handleLogout = () => {
    authService.logout();
    window.location.reload();
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'qr-scanner', label: 'QR Scanner', icon: UserCheck },
    { id: 'attendance', label: 'Attendance', icon: UserCheck },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 sticky top-0 z-30">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
        <h1 className="text-lg font-semibold truncate">Attendance Tracker</h1>
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b border-gray-200">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="ml-3 text-xl font-semibold text-gray-900 hidden sm:block">
              Attendance Tracker
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onPageChange(item.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-900 border border-primary-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3 flex-shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Profile */}
          <div className="px-4 py-4 border-t border-gray-200">
            <div className="flex items-center mb-3">
              <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-semibold text-sm">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div className="ml-3 min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize truncate">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3 flex-shrink-0" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
};
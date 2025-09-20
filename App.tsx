import { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { LoginForm } from './components/auth/LoginForm';
import { Navbar } from './components/layout/Navbar';
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { QRScanner } from './pages/QRScanner';
import { Attendance } from './pages/Attendance';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { authService } from './lib/auth';
import { db } from './lib/database';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize database with default data
      await db.initializeDefaultData();
      
      // Check authentication status
      setIsAuthenticated(authService.isAuthenticated());
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'students':
        return <Students />;
      case 'qr-scanner':
        return <QRScanner />;
      case 'attendance':
        return <Attendance />;
      case 'reports':
        return <Reports />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />
      
      <main className="lg:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {renderCurrentPage()}
        </div>
      </main>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
}

export default App;
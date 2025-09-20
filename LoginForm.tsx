import React, { useState } from 'react';
import { Eye, EyeOff, Users } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { authService } from '../../lib/auth';

interface LoginFormProps {
  onLogin: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await authService.login(username, password);
      onLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-blue-100 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center shadow-lg">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-6 text-3xl font-bold text-gray-900">
            Welcome Back
          </h1>
          <p className="mt-2 text-gray-600">
            Sign in to your attendance tracker account
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-2xl p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              }
            />

            {error && (
              <div className="bg-error-50 border border-error-200 rounded-lg p-3">
                <p className="text-sm text-error-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              loading={loading}
              size="lg"
            >
              Sign In
            </Button>
          </form>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Demo Credentials:</h3>
            <p className="text-sm text-gray-600">
              Username: <span className="font-mono">admin</span><br />
              Password: <span className="font-mono">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
import { User, UserRole } from '../types';
import { db } from './database';

interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

class AuthService {
  private tokenKey = 'attendance_token';
  private userKey = 'attendance_user';

  async login(username: string, password: string): Promise<AuthUser> {
    const users = await db.findAll('users');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const authUser: AuthUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    // Generate a simple token (in production, use proper JWT)
    const token = btoa(JSON.stringify({ userId: user.id, timestamp: Date.now() }));
    
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(authUser));

    return authUser;
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  getCurrentUser(): AuthUser | null {
    const userStr = localStorage.getItem(this.userKey);
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.tokenKey);
    return !!token;
  }

  hasRole(role: UserRole): boolean {
    const user = this.getCurrentUser();
    if (!user) return false;

    const roleHierarchy: Record<UserRole, number> = {
      viewer: 1,
      teacher: 2,
      admin: 3,
    };

    return roleHierarchy[user.role] >= roleHierarchy[role];
  }
}

export const authService = new AuthService();
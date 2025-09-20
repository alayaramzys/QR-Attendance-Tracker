import { Student, AttendanceRecord, ClassSession, User } from '../types';

interface DatabaseSchema {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  classSessions: ClassSession[];
  users: User[];
}

class LocalDatabase {
  private dbName = 'attendanceTrackerDB';
  private version = 1;

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Students store
        if (!db.objectStoreNames.contains('students')) {
          const studentsStore = db.createObjectStore('students', { keyPath: 'id' });
          studentsStore.createIndex('studentId', 'studentId', { unique: false });
          studentsStore.createIndex('class', 'class');
          studentsStore.createIndex('email', 'email', { unique: false });
        }

        // Attendance records store
        if (!db.objectStoreNames.contains('attendanceRecords')) {
          const attendanceStore = db.createObjectStore('attendanceRecords', { keyPath: 'id' });
          attendanceStore.createIndex('studentId', 'studentId');
          attendanceStore.createIndex('date', 'date');
          attendanceStore.createIndex('sessionId', 'sessionId');
        }

        // Class sessions store
        if (!db.objectStoreNames.contains('classSessions')) {
          const sessionsStore = db.createObjectStore('classSessions', { keyPath: 'id' });
          sessionsStore.createIndex('date', 'date');
          sessionsStore.createIndex('class', 'class');
          sessionsStore.createIndex('isActive', 'isActive');
        }

        // Users store
        if (!db.objectStoreNames.contains('users')) {
          const usersStore = db.createObjectStore('users', { keyPath: 'id' });
          usersStore.createIndex('username', 'username', { unique: false });
          usersStore.createIndex('email', 'email', { unique: false });
        }
      };
    });
  }

  async create<T extends keyof DatabaseSchema>(
    storeName: T,
    data: DatabaseSchema[T][0]
  ): Promise<DatabaseSchema[T][0]> {
    const db = await this.openDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    const newItem = {
      ...data,
      id: data.id || crypto.randomUUID(),
      createdAt: data.createdAt || new Date(),
      updatedAt: new Date(),
    };

    await new Promise((resolve, reject) => {
      const request = store.add(newItem);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return newItem;
  }

  async findAll<T extends keyof DatabaseSchema>(
    storeName: T
  ): Promise<DatabaseSchema[T]> {
    const db = await this.openDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    const result = await new Promise<DatabaseSchema[T]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return result;
  }

  async findById<T extends keyof DatabaseSchema>(
    storeName: T,
    id: string
  ): Promise<DatabaseSchema[T][0] | undefined> {
    const db = await this.openDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);

    const result = await new Promise<DatabaseSchema[T][0] | undefined>((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return result;
  }

  async findByIndex<T extends keyof DatabaseSchema>(
    storeName: T,
    indexName: string,
    value: any
  ): Promise<DatabaseSchema[T][0] | undefined> {
    const db = await this.openDB();
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);

    const result = await new Promise<DatabaseSchema[T][0] | undefined>((resolve, reject) => {
      const request = index.get(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return result;
  }

  async update<T extends keyof DatabaseSchema>(
    storeName: T,
    id: string,
    updates: Partial<DatabaseSchema[T][0]>
  ): Promise<DatabaseSchema[T][0]> {
    const db = await this.openDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    const existing = await new Promise<DatabaseSchema[T][0]>((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    if (!existing) {
      throw new Error(`Record with id ${id} not found`);
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    await new Promise((resolve, reject) => {
      const request = store.put(updated);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    db.close();
    return updated;
  }

  async delete<T extends keyof DatabaseSchema>(
    storeName: T,
    id: string
  ): Promise<void> {
    const db = await this.openDB();
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    db.close();
  }

  async query<T extends keyof DatabaseSchema>(
    storeName: T,
    predicate: (item: DatabaseSchema[T][0]) => boolean
  ): Promise<DatabaseSchema[T]> {
    const all = await this.findAll(storeName);
    return all.filter(predicate);
  }

  async initializeDefaultData(): Promise<void> {
    try {
      // Check if any users exist
      const existingUsers = await this.findAll('users');
      
      if (existingUsers.length === 0) {
        // Create default admin user only if no users exist
        await this.create('users', {
          id: crypto.randomUUID(),
          username: 'admin',
          email: 'admin@school.edu',
          password: 'admin123', // In production, this would be hashed
          role: 'admin',
          firstName: 'System',
          lastName: 'Administrator',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Error initializing default data:', error);
    }
  }
}

export const db = new LocalDatabase();
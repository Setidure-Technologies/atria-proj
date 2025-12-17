import { Responses } from '../utils/scoring';

interface TestResponse {
  id?: number;
  student_name: string;
  student_email: string;
  responses: Responses;
  executing_score: number;
  influencing_score: number;
  relationship_building_score: number;
  strategic_thinking_score: number;
  primary_talent_domain: string;
  created_at: string;
}

class LocalDatabase {
  private dbName = 'psychometric_test_db';
  private dbVersion = 1;
  private storeName = 'test_responses';

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          
          // Create indexes for common queries
          store.createIndex('student_email', 'student_email', { unique: false });
          store.createIndex('created_at', 'created_at', { unique: false });
        }
      };
    });
  }

  async insertTestResponse(data: {
    student_name: string;
    student_email: string;
    responses: Responses;
    executing_score: number;
    influencing_score: number;
    relationship_building_score: number;
    strategic_thinking_score: number;
    primary_talent_domain: string;
  }) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const testResponse: TestResponse = {
        ...data,
        created_at: new Date().toISOString()
      };
      
      const request = store.add(testResponse);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const id = request.result;
          console.log('Test response saved to local database with ID:', id);
          resolve({ success: true, id });
        };
        request.onerror = () => {
          console.error('Error saving to local database:', request.error);
          reject({ success: false, error: request.error });
        };
      });
    } catch (error) {
      console.error('Error opening database:', error);
      return { success: false, error };
    }
  }

  async getAllTestResponses(): Promise<TestResponse[]> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const results = request.result.sort((a: TestResponse, b: TestResponse) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          resolve(results);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error retrieving data:', error);
      return [];
    }
  }

  async getTestResponsesByEmail(email: string): Promise<TestResponse[]> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('student_email');
      const request = index.getAll(email);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const results = request.result.sort((a: TestResponse, b: TestResponse) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          resolve(results);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error retrieving data by email:', error);
      return [];
    }
  }

  async clearAllData(): Promise<boolean> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log('All test responses cleared from local database');
          resolve(true);
        };
        request.onerror = () => {
          console.error('Error clearing database:', request.error);
          reject(false);
        };
      });
    } catch (error) {
      console.error('Error clearing database:', error);
      return false;
    }
  }
}

export const localDB = new LocalDatabase();

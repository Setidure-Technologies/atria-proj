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
  test_start_time?: string;
  test_completion_time?: string;
  test_violations?: string[];
  is_auto_submit?: boolean;
  questions_answered?: number;
  created_at: string;
}

class ApiDatabase {
  private baseUrl: string;

  constructor() {
    // Use environment variable, with fallback for development
    const apiBase = import.meta.env.VITE_API_URL || '';
    this.baseUrl = apiBase ? `${apiBase}/api` : '/api';
  }

  private async fetchApi(endpoint: string, options: RequestInit = {}) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log('🌐 Making API request to:', url);
      console.log('📋 Request options:', options);
      if (options.body) console.log('📦 Request body:', options.body);

      const token = localStorage.getItem('candidate_token');
      const headers: any = {
        'Content-Type': 'application/json',
        ...options.headers,
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        headers,
        ...options,
      });

      console.log('📊 Response status:', response.status);
      console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ API Error Response:', errorData);
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('✅ API Success Response:', result);
      return result;
    } catch (error) {
      console.error(`❌ API Error (${endpoint}):`, error);
      throw error;
    }
  }

  async validateTestToken(assignmentId: string, token: string) {
    try {
      const result = await this.fetchApi(`/candidate/test/${assignmentId}?token=${encodeURIComponent(token)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return result;
    } catch (error) {
      console.error('Token validation failed:', error);
      return { success: false, error: 'Invalid token' };
    }
  }

  async submitTestWithToken(assignmentId: string, token: string, data: any) {
    try {
      const result = await this.fetchApi(`/candidate/test/${assignmentId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...data, token })
      });
      return result;
    } catch (error) {
      console.error('Submission failed:', error);
      return { success: false, error: 'Submission failed' };
    }
  }

  async insertTestResponse(data: {
    student_name: string;
    student_email: string;
    responses: Responses | any; // Allow any for adaptive
    executing_score?: number;
    influencing_score?: number;
    relationship_building_score?: number;
    strategic_thinking_score?: number;
    primary_talent_domain?: string;
    detailed_scores?: any;
    test_start_time?: string;
    test_completion_time?: string;
    test_violations?: string[];
    is_auto_submit?: boolean;
    questions_answered?: number;
    test_type?: string; // Add test_type
    stream?: string; // Add stream
    submitted_at?: string;
  }) {
    try {
      console.log('📡 ApiDatabase.insertTestResponse called with:', data);
      console.log('🌐 Making request to:', `${this.baseUrl}/responses`);

      const result = await this.fetchApi('/responses', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      console.log('✅ Test response saved to server:', result);
      return { success: true, id: result.id };
    } catch (error) {
      console.error('❌ Error saving test response:', error);

      // Fallback to localStorage if server is unavailable
      try {
        const fallbackResponse = {
          ...data,
          id: Date.now(), // Simple ID for fallback
          created_at: new Date().toISOString()
        };

        const existingData = localStorage.getItem('psychometric_fallback_responses');
        const fallbackResponses = existingData ? JSON.parse(existingData) : [];
        fallbackResponses.push(fallbackResponse);
        localStorage.setItem('psychometric_fallback_responses', JSON.stringify(fallbackResponses));

        console.log('Saved to localStorage as fallback');
        return { success: true, id: fallbackResponse.id, fallback: true };
      } catch (fallbackError) {
        console.error('Fallback save failed:', fallbackError);
        return { success: false, error: 'Failed to save response' };
      }
    }
  }

  async getAllTestResponses(): Promise<TestResponse[]> {
    try {
      const result = await this.fetchApi('/responses');
      return result.responses || [];
    } catch (error) {
      console.error('Error fetching test responses:', error);

      // Fallback to localStorage if server is unavailable
      try {
        const fallbackData = localStorage.getItem('psychometric_fallback_responses');
        const fallbackResponses = fallbackData ? JSON.parse(fallbackData) : [];
        console.log('Loaded from localStorage as fallback');
        return fallbackResponses;
      } catch (fallbackError) {
        console.error('Fallback load failed:', fallbackError);
        return [];
      }
    }
  }

  async getTestResponsesByEmail(email: string): Promise<TestResponse[]> {
    try {
      const result = await this.fetchApi(`/responses/email/${encodeURIComponent(email)}`);
      return result.responses || [];
    } catch (error) {
      console.error('Error fetching responses by email:', error);
      return [];
    }
  }

  async clearAllData(): Promise<boolean> {
    try {
      await this.fetchApi('/responses', { method: 'DELETE' });

      // Also clear localStorage fallback
      localStorage.removeItem('psychometric_fallback_responses');

      console.log('All data cleared from server and localStorage');
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  async getStatistics() {
    try {
      const result = await this.fetchApi('/stats');
      return result.stats;
    } catch (error) {
      console.error('Error fetching statistics:', error);
      return null;
    }
  }

  async healthCheck() {
    try {
      const result = await this.fetchApi('/health');
      return result.status === 'OK';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Sync fallback data to server when connection is restored
  async syncFallbackData() {
    try {
      const fallbackData = localStorage.getItem('psychometric_fallback_responses');
      if (!fallbackData) return { success: true, synced: 0 };

      const fallbackResponses = JSON.parse(fallbackData);
      let syncedCount = 0;

      for (const response of fallbackResponses) {
        try {
          await this.insertTestResponse({
            student_name: response.student_name,
            student_email: response.student_email,
            responses: response.responses,
            executing_score: response.executing_score,
            influencing_score: response.influencing_score,
            relationship_building_score: response.relationship_building_score,
            strategic_thinking_score: response.strategic_thinking_score,
            primary_talent_domain: response.primary_talent_domain,
            test_start_time: response.test_start_time,
            test_completion_time: response.test_completion_time,
            test_violations: response.test_violations,
            is_auto_submit: response.is_auto_submit,
            questions_answered: response.questions_answered
          });
          syncedCount++;
        } catch (error) {
          console.error('Failed to sync response:', error);
        }
      }

      // Clear fallback data after successful sync
      if (syncedCount > 0) {
        localStorage.removeItem('psychometric_fallback_responses');
      }

      return { success: true, synced: syncedCount };
    } catch (error) {
      console.error('Error syncing fallback data:', error);
      return { success: false, synced: 0 };
    }
  }

  async generatePDFReport(testResponseId: number): Promise<void> {
    try {
      const url = `${this.baseUrl}/generate-pdf`;
      console.log('🌐 Making PDF generation request to:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ testResponseId }),
      });

      console.log('📊 Response status:', response.status);
      console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          // If we can't parse JSON, use the status text
        }
        throw new Error(errorMessage);
      }

      // Check if we actually received a PDF
      const contentType = response.headers.get('content-type');
      console.log('📋 Content type:', contentType);

      if (!contentType || !contentType.includes('application/pdf')) {
        throw new Error('Expected PDF content but received: ' + contentType);
      }

      // The response should be a blob (PDF file)
      const blob = await response.blob();
      console.log('📋 PDF blob size:', blob.size);

      if (blob.size === 0) {
        throw new Error('Received empty PDF file');
      }

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `strength-report-${testResponseId}.pdf`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      console.log('✅ PDF report downloaded successfully:', filename);
    } catch (error) {
      console.error('❌ Error generating PDF report:', error);
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      const result = await this.fetchApi('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      return result;
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  async getAssignments(token: string) {
    try {
      const result = await this.fetchApi('/candidate/assignments', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return result;
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      return { success: false, error: 'Failed to fetch assignments' };
    }
  }

  async updateProfile(token: string, data: any) {
    try {
      const result = await this.fetchApi('/candidate/profile', {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data)
      });
      return result;
    } catch (error) {
      console.error('Failed to update profile:', error);
      return { success: false, error: 'Failed to update profile' };
    }
  }
  async getProfile() {
    return this.fetchApi('/me/profile');
  }

  async saveProfile(data: any) {
    return this.fetchApi('/me/profile', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCandidateStatus() {
    try {
      return await this.fetchApi('/candidate/status');
    } catch (error) {
      console.error('Failed to get candidate status:', error);
      return { success: false, error: 'Failed to get status' };
    }
  }

  async sendOTP(email: string) {
    try {
      return await this.fetchApi('/auth/send-otp', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
    } catch (error) {
      console.error('Failed to send OTP:', error);
      return { success: false, error: 'Failed to send verification code' };
    }
  }

  async verifyOTP(email: string, code: string) {
    try {
      return await this.fetchApi('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify({ email, code }),
      });
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      return { success: false, error: 'Failed to verify code' };
    }
  }
}

export const apiDB = new ApiDatabase();

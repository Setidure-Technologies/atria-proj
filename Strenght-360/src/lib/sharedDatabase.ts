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

class SharedDatabase {
  private storageKey = 'psychometric_test_responses';
  private nextIdKey = 'psychometric_test_next_id';

  private getNextId(): number {
    const currentId = parseInt(localStorage.getItem(this.nextIdKey) || '1');
    localStorage.setItem(this.nextIdKey, (currentId + 1).toString());
    return currentId;
  }

  private getAllResponses(): TestResponse[] {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error parsing stored responses:', error);
      return [];
    }
  }

  private saveAllResponses(responses: TestResponse[]): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(responses));
    } catch (error) {
      console.error('Error saving responses:', error);
    }
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
      const responses = this.getAllResponses();
      const newResponse: TestResponse = {
        ...data,
        id: this.getNextId(),
        created_at: new Date().toISOString()
      };
      
      responses.push(newResponse);
      this.saveAllResponses(responses);
      
      console.log('Test response saved with ID:', newResponse.id);
      return { success: true, id: newResponse.id };
    } catch (error) {
      console.error('Error saving test response:', error);
      return { success: false, error };
    }
  }

  async getAllTestResponses(): Promise<TestResponse[]> {
    try {
      const responses = this.getAllResponses();
      return responses.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } catch (error) {
      console.error('Error retrieving test responses:', error);
      return [];
    }
  }

  async getTestResponsesByEmail(email: string): Promise<TestResponse[]> {
    try {
      const responses = this.getAllResponses();
      return responses
        .filter(response => response.student_email === email)
        .sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
    } catch (error) {
      console.error('Error retrieving responses by email:', error);
      return [];
    }
  }

  async clearAllData(): Promise<boolean> {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.nextIdKey);
      console.log('All test responses cleared');
      return true;
    } catch (error) {
      console.error('Error clearing data:', error);
      return false;
    }
  }

  // Export all data to JSON file
  exportData(): void {
    try {
      const responses = this.getAllResponses();
      const dataStr = JSON.stringify(responses, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `psychometric_test_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting data:', error);
    }
  }

  // Import data from JSON file
  importData(file: File): Promise<{ success: boolean; message: string; count?: number }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const jsonData = e.target?.result as string;
          const importedResponses: TestResponse[] = JSON.parse(jsonData);
          
          if (!Array.isArray(importedResponses)) {
            resolve({ success: false, message: 'Invalid file format. Expected an array of responses.' });
            return;
          }

          // Validate the structure of imported data
          for (const response of importedResponses) {
            if (!response.student_name || !response.student_email || !response.created_at) {
              resolve({ success: false, message: 'Invalid data structure in imported file.' });
              return;
            }
          }

          const existingResponses = this.getAllResponses();
          const existingEmails = new Set(existingResponses.map(r => `${r.student_email}-${r.created_at}`));
          
          // Filter out duplicates based on email and timestamp
          const newResponses = importedResponses.filter(
            response => !existingEmails.has(`${response.student_email}-${response.created_at}`)
          );

          if (newResponses.length === 0) {
            resolve({ success: true, message: 'No new responses to import. All data already exists.', count: 0 });
            return;
          }

          // Assign new IDs to imported responses to avoid conflicts
          const maxId = Math.max(0, ...existingResponses.map(r => r.id || 0));
          newResponses.forEach((response, index) => {
            response.id = maxId + index + 1;
          });

          // Update next ID counter
          localStorage.setItem(this.nextIdKey, (maxId + newResponses.length + 1).toString());

          // Merge and save
          const allResponses = [...existingResponses, ...newResponses];
          this.saveAllResponses(allResponses);
          
          resolve({ 
            success: true, 
            message: `Successfully imported ${newResponses.length} new responses.`,
            count: newResponses.length
          });
        } catch (error) {
          resolve({ success: false, message: 'Error parsing JSON file. Please check the file format.' });
        }
      };
      reader.onerror = () => {
        resolve({ success: false, message: 'Error reading file.' });
      };
      reader.readAsText(file);
    });
  }

  // Get data for sharing (returns a shareable JSON string)
  getShareableData(): string {
    const responses = this.getAllResponses();
    return JSON.stringify(responses, null, 2);
  }

  // Import data from shareable string
  importFromString(jsonString: string): { success: boolean; message: string; count?: number } {
    try {
      const importedResponses: TestResponse[] = JSON.parse(jsonString);
      
      if (!Array.isArray(importedResponses)) {
        return { success: false, message: 'Invalid data format.' };
      }

      const existingResponses = this.getAllResponses();
      const existingEmails = new Set(existingResponses.map(r => `${r.student_email}-${r.created_at}`));
      
      const newResponses = importedResponses.filter(
        response => !existingEmails.has(`${response.student_email}-${response.created_at}`)
      );

      if (newResponses.length === 0) {
        return { success: true, message: 'No new responses to import.', count: 0 };
      }

      const maxId = Math.max(0, ...existingResponses.map(r => r.id || 0));
      newResponses.forEach((response, index) => {
        response.id = maxId + index + 1;
      });

      localStorage.setItem(this.nextIdKey, (maxId + newResponses.length + 1).toString());

      const allResponses = [...existingResponses, ...newResponses];
      this.saveAllResponses(allResponses);
      
      return { 
        success: true, 
        message: `Successfully imported ${newResponses.length} new responses.`,
        count: newResponses.length
      };
    } catch (error) {
      return { success: false, message: 'Error parsing data.' };
    }
  }
}

export const sharedDB = new SharedDatabase();

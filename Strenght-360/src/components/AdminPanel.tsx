import { useState, useEffect } from 'react';
import { apiDB } from '../lib/apiDatabase';
import { Database, Download, Trash2, LogOut, Shield, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';

interface TestResponse {
  id?: number;
  student_name: string;
  student_email: string;
  responses: any;
  executing_score: number;
  influencing_score: number;
  relationship_building_score: number;
  strategic_thinking_score: number;
  primary_talent_domain: string;
  created_at: string;
}

interface AdminPanelProps {
  onLogout?: () => void;
}

export function AdminPanel({ onLogout }: AdminPanelProps) {
  const [responses, setResponses] = useState<TestResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [serverStatus, setServerStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

  useEffect(() => {
    loadResponses();
    checkServerStatus();
  }, []);

  const checkServerStatus = async () => {
    setServerStatus('checking');
    const isConnected = await apiDB.healthCheck();
    setServerStatus(isConnected ? 'connected' : 'disconnected');
    
    // If server is back online, sync any fallback data
    if (isConnected) {
      const syncResult = await apiDB.syncFallbackData();
      if (syncResult.synced > 0) {
        console.log(`Synced ${syncResult.synced} fallback responses to server`);
        // Reload data after sync
        loadResponses();
      }
    }
  };

  const loadResponses = async () => {
    setLoading(true);
    try {
      const data = await apiDB.getAllTestResponses();
      setResponses(data);
    } catch (error) {
      console.error('Error loading responses:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    if (responses.length === 0) {
      alert('No data to export. Please ensure there are test responses before exporting.');
      return;
    }

    // Prepare data for Excel export
    const excelData = responses.map(response => {
      // Create detailed response breakdown
      const responseDetails: { [key: string]: string | number } = {};
      
      // Add detailed responses for each question
      if (response.responses && typeof response.responses === 'object') {
        for (const [questionId, resp] of Object.entries(response.responses)) {
          if (resp && typeof resp === 'object' && 'statementA' in resp && 'statementB' in resp) {
            responseDetails[`Q${questionId}_Statement_A`] = (resp as any).statementA;
            responseDetails[`Q${questionId}_Statement_B`] = (resp as any).statementB;
          }
        }
      }

      return {
        'Student Name': response.student_name,
        'Email': response.student_email,
        'Primary Talent Domain': response.primary_talent_domain,
        'Executing Score': response.executing_score,
        'Influencing Score': response.influencing_score,
        'Relationship Building Score': response.relationship_building_score,
        'Strategic Thinking Score': response.strategic_thinking_score,
        'Date Taken': new Date(response.created_at).toLocaleDateString(),
        'Time Taken': new Date(response.created_at).toLocaleTimeString(),
        ...responseDetails
      };
    });

    // Create a new workbook and worksheet
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Test Results');

    // Auto-size columns
    const cols = Object.keys(excelData[0] || {}).map(() => ({ wch: 20 }));
    ws['!cols'] = cols;

    // Export the file
    const fileName = `psychometric_test_results_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const clearAllData = async () => {
    if (window.confirm('Are you sure you want to clear all test responses? This action cannot be undone.')) {
      try {
        await apiDB.clearAllData();
        setResponses([]);
        alert('All data cleared successfully');
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Error clearing data');
      }
    }
  };

  const refreshData = async () => {
    await loadResponses();
    await checkServerStatus();
  };

  const goBackToApp = () => {
    if (onLogout) {
      onLogout();
    } else {
      window.location.href = '/';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Database className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
          <p className="mt-2 text-gray-600">Loading test responses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-orange-100 p-2 rounded-lg">
                <Shield className="text-orange-600" size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                <div className="flex items-center gap-4">
                  <p className="text-gray-600">{responses.length} total responses</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      serverStatus === 'connected' ? 'bg-green-500' : 
                      serverStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
                    }`}></div>
                    <span className="text-sm text-gray-500">
                      {serverStatus === 'connected' ? 'Server Connected' : 
                       serverStatus === 'disconnected' ? 'Server Offline (Fallback Mode)' : 'Checking...'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={goBackToApp}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {onLogout ? 'Logout' : 'Back to App'}
              </button>
              
              <button
                onClick={refreshData}
                className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              
              <button
                onClick={exportData}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </button>

              <button
                onClick={clearAllData}
                className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </button>
            </div>
          </div>

          {responses.length === 0 ? (
            <div className="text-center py-12">
              <Database className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No test responses</h3>
              <p className="mt-1 text-sm text-gray-500">No one has taken the assessment yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Primary Domain
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scores
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date Taken
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {responses.map((response, index) => (
                    <tr key={response.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {response.student_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {response.student_email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                          {response.primary_talent_domain}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          <div>Executing: {response.executing_score}</div>
                          <div>Influencing: {response.influencing_score}</div>
                          <div>Relationship: {response.relationship_building_score}</div>
                          <div>Strategic: {response.strategic_thinking_score}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(response.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow mt-6 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🌐 Centralized Data Collection</h3>
          <div className="space-y-4 text-sm text-gray-700">
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">✅ How It Works:</h4>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Centralized Server:</strong> All test responses are automatically sent to a central server</li>
                <li><strong>Real-time Collection:</strong> Responses from any browser/device appear here instantly</li>
                <li><strong>Automatic Sync:</strong> No manual importing/exporting needed</li>
                <li><strong>Offline Fallback:</strong> If server is down, responses are saved locally and synced when connection returns</li>
              </ul>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">📊 Features:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>Server Status:</strong> Green indicator = connected, Red = offline mode</li>
                <li><strong>Auto-Refresh:</strong> Click "Refresh" to get latest responses</li>
                <li><strong>Excel Export:</strong> Download detailed reports with individual question responses</li>
                <li><strong>Centralized Admin:</strong> Only one admin panel needed for all responses</li>
              </ul>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-semibold text-orange-900 mb-2">� Benefits:</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>No more browser-specific data storage</li>
                <li>Responses from students anywhere on the internet</li>
                <li>Real-time data collection and reporting</li>
                <li>Reliable backup and data persistence</li>
                <li>Easy deployment and sharing of the test</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

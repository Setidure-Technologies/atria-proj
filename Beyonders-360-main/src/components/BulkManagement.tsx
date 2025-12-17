import React, { useState, useEffect } from 'react';
import { Upload, Download, Users, FileText, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:4902';

interface BulkOperation {
    id: string;
    operation_type: string;
    status: string;
    file_name: string;
    total_records: number;
    processed_records: number;
    failed_records: number;
    results?: any;
    created_at: string;
    completed_at?: string;
}

interface BulkManagementProps {
    token: string;
}

export function BulkManagement({ token }: BulkManagementProps) {
    const [operations, setOperations] = useState<BulkOperation[]>([]);
    const [loading, setLoading] = useState(false);
    const [uploadType, setUploadType] = useState<'users' | 'assignments'>('users');
    const [csvData, setCsvData] = useState<any[]>([]);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchOperations();
    }, []);

    const fetchOperations = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/api/admin/bulk/operations`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setOperations(data.operations);
            }
        } catch (error) {
            console.error('Failed to fetch operations:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setCsvFile(file);

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const rows = text.split('\n').filter(row => row.trim());
            const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''));
            
            const data = rows.slice(1).map(row => {
                const values = row.split(',').map(v => v.trim().replace(/"/g, ''));
                const obj: any = {};
                headers.forEach((header, index) => {
                    obj[header] = values[index] || '';
                });
                return obj;
            }).filter(obj => Object.values(obj).some(val => val)); // Filter out empty rows
            
            setCsvData(data);
        };
        reader.readAsText(file);
    };

    const handleBulkUpload = async () => {
        if (!csvData.length || !csvFile) {
            alert('Please select and preview a CSV file first');
            return;
        }

        try {
            setProcessing(true);

            const endpoint = uploadType === 'users' 
                ? `${API_URL}/api/admin/bulk/users/upload`
                : `${API_URL}/api/admin/bulk/assignments/upload`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    data: csvData,
                    fileName: csvFile.name,
                }),
            });

            const result = await response.json();
            
            if (result.success) {
                alert(`Bulk operation completed!\nSuccessful: ${result.results.successful}\nFailed: ${result.results.failed}`);
                setCsvData([]);
                setCsvFile(null);
                fetchOperations();
            } else {
                alert(`Error: ${result.error}`);
            }
        } catch (error) {
            alert('Failed to process bulk upload');
            console.error('Bulk upload error:', error);
        } finally {
            setProcessing(false);
        }
    };

    const downloadTemplate = (type: 'users' | 'assignments') => {
        const templates = {
            users: [
                ['email', 'name', 'phone', 'role', 'institution', 'date_of_birth'],
                ['student1@example.com', 'John Doe', '+1234567890', 'CANDIDATE', 'MIT', '2000-01-15'],
                ['student2@example.com', 'Jane Smith', '+1234567891', 'CANDIDATE', 'Harvard', '1999-12-20'],
            ],
            assignments: [
                ['email', 'test_id', 'due_at'],
                ['student1@example.com', 'strength-360-test', '2024-12-31T23:59:59Z'],
                ['student2@example.com', 'beyonders-360-test', '2024-12-31T23:59:59Z'],
            ],
        };

        const csvContent = templates[type].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_template.csv`;
        a.click();
        
        window.URL.revokeObjectURL(url);
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="text-green-500" size={20} />;
            case 'failed':
                return <XCircle className="text-red-500" size={20} />;
            case 'processing':
                return <Loader className="text-blue-500 animate-spin" size={20} />;
            default:
                return <AlertCircle className="text-yellow-500" size={20} />;
        }
    };

    if (loading) {
        return <div className="text-center py-12">Loading bulk operations...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Bulk Operations</h2>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Bulk Upload</h3>
                
                {/* Upload Type Selection */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Operation Type
                    </label>
                    <div className="flex gap-4">
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="users"
                                checked={uploadType === 'users'}
                                onChange={(e) => setUploadType(e.target.value as 'users')}
                                className="mr-2"
                            />
                            Bulk User Creation
                        </label>
                        <label className="flex items-center">
                            <input
                                type="radio"
                                value="assignments"
                                checked={uploadType === 'assignments'}
                                onChange={(e) => setUploadType(e.target.value as 'assignments')}
                                className="mr-2"
                            />
                            Bulk Test Assignment
                        </label>
                    </div>
                </div>

                {/* Template Download */}
                <div className="mb-4">
                    <button
                        onClick={() => downloadTemplate(uploadType)}
                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                    >
                        <Download size={18} />
                        Download {uploadType === 'users' ? 'User' : 'Assignment'} Template
                    </button>
                </div>

                {/* File Upload */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Upload CSV File
                    </label>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                </div>

                {/* Preview */}
                {csvData.length > 0 && (
                    <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Preview ({csvData.length} records)
                        </h4>
                        <div className="max-h-40 overflow-y-auto bg-gray-50 rounded-lg p-3">
                            <table className="min-w-full text-xs">
                                <thead>
                                    <tr>
                                        {Object.keys(csvData[0] || {}).map((header) => (
                                            <th key={header} className="text-left p-1 font-medium text-gray-600">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {csvData.slice(0, 5).map((row, index) => (
                                        <tr key={index}>
                                            {Object.values(row).map((value: any, i) => (
                                                <td key={i} className="p-1 text-gray-800">
                                                    {String(value).length > 20 ? String(value).substring(0, 20) + '...' : String(value)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {csvData.length > 5 && (
                                <p className="text-xs text-gray-500 mt-2">
                                    ... and {csvData.length - 5} more records
                                </p>
                            )}
                        </div>
                    </div>
                )}

                {/* Upload Button */}
                <button
                    onClick={handleBulkUpload}
                    disabled={!csvData.length || processing}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                        !csvData.length || processing
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-orange-600 text-white hover:bg-orange-700'
                    }`}
                >
                    {processing ? (
                        <Loader className="animate-spin" size={18} />
                    ) : (
                        <Upload size={18} />
                    )}
                    {processing ? 'Processing...' : `Process ${uploadType === 'users' ? 'Users' : 'Assignments'}`}
                </button>
            </div>

            {/* Operations History */}
            <div className="bg-white rounded-lg shadow-md">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Operation History</h3>
                </div>
                <div className="overflow-x-auto">
                    {operations.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            No bulk operations found
                        </div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Operation
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        File
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Progress
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Date
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {operations.map((operation) => (
                                    <tr key={operation.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {operation.operation_type === 'user_import' ? (
                                                    <Users className="text-blue-500 mr-2" size={16} />
                                                ) : (
                                                    <FileText className="text-green-500 mr-2" size={16} />
                                                )}
                                                <span className="text-sm text-gray-900 capitalize">
                                                    {operation.operation_type.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {operation.file_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                {getStatusIcon(operation.status)}
                                                <span className="ml-2 text-sm text-gray-900 capitalize">
                                                    {operation.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div>
                                                <div className="text-sm">
                                                    {operation.processed_records} / {operation.total_records}
                                                </div>
                                                {operation.failed_records > 0 && (
                                                    <div className="text-xs text-red-600">
                                                        {operation.failed_records} failed
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(operation.created_at).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

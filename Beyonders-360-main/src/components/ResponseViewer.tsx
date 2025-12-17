import React, { useState, useEffect } from 'react';
import { Download, Eye, FileText, Filter } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4902';

interface Response {
    id: string;
    user_name: string;
    user_email: string;
    test_title: string;
    primary_talent_domain?: string;
    executing_score?: number;
    influencing_score?: number;
    relationship_building_score?: number;
    strategic_thinking_score?: number;
    submitted_at: string;
    is_auto_submit: boolean;
    questions_answered: number;
}

interface ResponseViewerProps {
    token: string;
}

export function ResponseViewer({ token }: ResponseViewerProps) {
    const [responses, setResponses] = useState<Response[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterTest, setFilterTest] = useState('all');
    const [selectedResponse, setSelectedResponse] = useState<Response | null>(null);

    useEffect(() => {
        fetchResponses();
    }, []);

    const fetchResponses = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/responses`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setResponses(data.responses);
            }
        } catch (error) {
            console.error('Failed to fetch responses:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToCSV = () => {
        if (responses.length === 0) {
            alert('No data to export');
            return;
        }

        const headers = [
            'Name',
            'Email',
            'Test',
            'Primary Domain',
            'Executing',
            'Influencing',
            'Relationship Building',
            'Strategic Thinking',
            'Questions Answered',
            'Auto Submit',
            'Submitted At'
        ];

        const rows = responses.map(r => [
            r.user_name,
            r.user_email,
            r.test_title,
            r.primary_talent_domain || 'N/A',
            r.executing_score || 0,
            r.influencing_score || 0,
            r.relationship_building_score || 0,
            r.strategic_thinking_score || 0,
            r.questions_answered,
            r.is_auto_submit ? 'Yes' : 'No',
            new Date(r.submitted_at).toLocaleString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `atria-responses-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const uniqueTests = Array.from(new Set(responses.map(r => r.test_title)));
    const filteredResponses = filterTest === 'all'
        ? responses
        : responses.filter(r => r.test_title === filterTest);

    if (loading) {
        return <div className="text-center py-12">Loading responses...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">Test Responses</h2>
                <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    disabled={responses.length === 0}
                >
                    <Download size={18} />
                    <span>Export CSV</span>
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total Responses" value={responses.length} />
                <StatCard title="Unique Users" value={new Set(responses.map(r => r.user_email)).size} />
                <StatCard title="Tests" value={uniqueTests.length} />
                <StatCard
                    title="Completion Rate"
                    value={`${responses.filter(r => !r.is_auto_submit).length}/${responses.length}`}
                />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-3">
                <Filter size={18} className="text-gray-500" />
                <select
                    value={filterTest}
                    onChange={(e) => setFilterTest(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                >
                    <option value="all">All Tests</option>
                    {uniqueTests.map(test => (
                        <option key={test} value={test}>{test}</option>
                    ))}
                </select>
            </div>

            {/* Responses Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Primary Domain</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scores</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Submitted</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredResponses.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No responses found
                                    </td>
                                </tr>
                            ) : (
                                filteredResponses.map((response) => (
                                    <tr key={response.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{response.user_name}</div>
                                            <div className="text-sm text-gray-500">{response.user_email}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-900">
                                            {response.test_title}
                                        </td>
                                        <td className="px-6 py-4">
                                            {response.primary_talent_domain ? (
                                                <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                    {response.primary_talent_domain}
                                                </span>
                                            ) : (
                                                <span className="text-sm text-gray-400">N/A</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <ScoreDisplay response={response} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div>{new Date(response.submitted_at).toLocaleDateString()}</div>
                                            <div className="text-xs text-gray-400">
                                                {new Date(response.submitted_at).toLocaleTimeString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedResponse(response)}
                                                className="text-orange-600 hover:text-orange-900"
                                                title="View details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedResponse && (
                <ResponseDetailModal
                    response={selectedResponse}
                    onClose={() => setSelectedResponse(null)}
                />
            )}
        </div>
    );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
    return (
        <div className="bg-white rounded-lg shadow-md p-4">
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
    );
}

function ScoreDisplay({ response }: { response: Response }) {
    if (!response.executing_score) {
        return <span className="text-sm text-gray-400">No scores</span>;
    }

    return (
        <div className="text-xs space-y-1">
            <div className="flex justify-between gap-2">
                <span className="text-gray-600">E:</span>
                <span className="font-medium">{response.executing_score?.toFixed(1)}</span>
            </div>
            <div className="flex justify-between gap-2">
                <span className="text-gray-600">I:</span>
                <span className="font-medium">{response.influencing_score?.toFixed(1)}</span>
            </div>
            <div className="flex justify-between gap-2">
                <span className="text-gray-600">R:</span>
                <span className="font-medium">{response.relationship_building_score?.toFixed(1)}</span>
            </div>
            <div className="flex justify-between gap-2">
                <span className="text-gray-600">S:</span>
                <span className="font-medium">{response.strategic_thinking_score?.toFixed(1)}</span>
            </div>
        </div>
    );
}

function ResponseDetailModal({ response, onClose }: { response: Response; onClose: () => void }) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-bold text-gray-900">Response Details</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-6">
                    {/* User Info */}
                    <div className="border-b pb-4">
                        <h4 className="font-semibold text-gray-900 mb-3">User Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Name</p>
                                <p className="font-medium">{response.user_name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Email</p>
                                <p className="font-medium">{response.user_email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Test Info */}
                    <div className="border-b pb-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Test Information</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Test</p>
                                <p className="font-medium">{response.test_title}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Submitted</p>
                                <p className="font-medium">{new Date(response.submitted_at).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Questions Answered</p>
                                <p className="font-medium">{response.questions_answered}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Auto Submit</p>
                                <p className="font-medium">{response.is_auto_submit ? 'Yes' : 'No'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Scores */}
                    {response.executing_score && (
                        <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Talent Domain Scores</h4>
                            <div className="space-y-3">
                                <ScoreBar label="Executing" score={response.executing_score} color="bg-blue-500" />
                                <ScoreBar label="Influencing" score={response.influencing_score!} color="bg-green-500" />
                                <ScoreBar label="Relationship Building" score={response.relationship_building_score!} color="bg-purple-500" />
                                <ScoreBar label="Strategic Thinking" score={response.strategic_thinking_score!} color="bg-orange-500" />
                            </div>
                            {response.primary_talent_domain && (
                                <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                                    <p className="text-sm text-purple-700">
                                        <strong>Primary Talent Domain:</strong> {response.primary_talent_domain}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                    <button
                        onClick={() => handleDownloadReport(response.id)}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Download size={18} />
                        <span>Download Report</span>
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

const handleDownloadReport = async (responseId: string) => {
    try {
        const response = await fetch(`${API_URL}/api/generate-pdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ testResponseId: responseId }),
        });

        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report-${responseId}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } else {
            alert('Failed to generate report');
        }
    } catch (error) {
        console.error('Error downloading report:', error);
        alert('Error downloading report');
    }
};

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
    const percentage = (score / 100) * 100;

    return (
        <div>
            <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-gray-700">{label}</span>
                <span className="text-gray-600">{score.toFixed(1)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`${color} h-2 rounded-full`} style={{ width: `${percentage}%` }} />
            </div>
        </div>
    );
}

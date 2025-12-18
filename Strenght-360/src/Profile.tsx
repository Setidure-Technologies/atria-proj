import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Download, ArrowLeft, Award, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4902';

interface Assignment {
    id: string;
    test_id: string;
    title: string;
    description: string;
    type: string;
    status: string;
    assigned_at: string;
    submitted_at?: string;
    response_id?: string;
}

interface UserProfile {
    name: string;
    email: string;
    phone: string;
    created_at: string;
}

export default function Profile() {
    const navigate = useNavigate();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            const token = localStorage.getItem('candidate_token');
            if (!token) {
                navigate('/login');
                return;
            }

            const headers = { 'Authorization': `Bearer ${token}` };

            // Fetch user info
            const userRes = await fetch(`${API_URL}/api/auth/me`, { headers });
            const userData = await userRes.json();

            // Fetch assignments
            const assignRes = await fetch(`${API_URL}/api/candidate/assignments`, { headers });
            const assignData = await assignRes.json();

            if (userData.success) {
                setUser(userData.user);
            }
            if (assignData.success) {
                setAssignments(assignData.assignments);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadReport = async (responseId: string, testTitle: string) => {
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
                a.download = `${testTitle.replace(/\s+/g, '_')}_Report.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('Report generation failed. Please contact support.');
            }
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download report');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8 flex items-center gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 hover:bg-gray-200 rounded-full transition"
                    >
                        <ArrowLeft size={24} className="text-gray-600" />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
                </div>

                {/* User Info Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={32} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
                            <p className="text-gray-500">Candidate</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center gap-3 text-gray-600">
                            <Mail size={20} />
                            <span>{user?.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <Phone size={20} />
                            <span>{user?.phone || 'No phone added'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <Calendar size={20} />
                            <span>Joined {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</span>
                        </div>
                    </div>
                </div>

                {/* Test History */}
                <h3 className="text-xl font-bold text-gray-900 mb-4">Test History</h3>
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    {assignments.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No tests assigned yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-100">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Test Name</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Type</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Date</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {assignments.map((assignment) => (
                                        <tr key={assignment.id} className="hover:bg-gray-50 transition">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{assignment.title}</div>
                                                <div className="text-xs text-gray-500">{assignment.description}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                                    {assignment.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${assignment.status === 'submitted'
                                                        ? 'bg-green-100 text-green-800'
                                                        : assignment.status === 'started'
                                                            ? 'bg-yellow-100 text-yellow-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {assignment.status === 'submitted' ? <Award size={12} /> : <Clock size={12} />}
                                                    <span className="capitalize">{assignment.status}</span>
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {assignment.submitted_at
                                                    ? new Date(assignment.submitted_at).toLocaleDateString()
                                                    : new Date(assignment.assigned_at).toLocaleDateString()
                                                }
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {assignment.status === 'submitted' && assignment.response_id && (
                                                    <button
                                                        onClick={() => handleDownloadReport(assignment.response_id!, assignment.title)}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                                                    >
                                                        <Download size={16} />
                                                        Report
                                                    </button>
                                                )}
                                                {assignment.status !== 'submitted' && (
                                                    <button
                                                        onClick={() => navigate(`/test/${assignment.id}`)}
                                                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                                                    >
                                                        Start
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

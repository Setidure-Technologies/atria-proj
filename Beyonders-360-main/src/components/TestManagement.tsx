import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Power, PowerOff } from 'lucide-react';

const API_URL = (import.meta as any).env.VITE_API_URL || '';

interface Test {
    id: string;
    title: string;
    description?: string;
    type: string;
    duration_minutes: number;
    is_active: boolean;
    created_at: string;
}

interface TestManagementProps {
    token: string;
}

export function TestManagement({ token }: TestManagementProps) {
    const [tests, setTests] = useState<Test[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchTests();
    }, []);

    const fetchTests = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/tests`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setTests(data.tests);
            }
        } catch (error) {
            console.error('Failed to fetch tests:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTestStatus = async (testId: string, currentStatus: boolean) => {
        try {
            const response = await fetch(`${API_URL}/api/admin/tests/${testId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ is_active: !currentStatus }),
            });

            const data = await response.json();
            if (data.success) {
                setTests(tests.map(t => t.id === testId ? { ...t, is_active: !currentStatus } : t));
            }
        } catch (error) {
            alert('Failed to update test status');
        }
    };

    if (loading) {
        return <div className="text-center py-12">Loading tests...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Test Management</h2>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                >
                    <Plus size={18} />
                    <span>Create Test</span>
                </button>
            </div>

            {/* Tests Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tests.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500">
                        No tests found. Create your first test!
                    </div>
                ) : (
                    tests.map((test) => (
                        <div key={test.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{test.title}</h3>
                                    <p className="text-sm text-gray-600 line-clamp-2">{test.description || 'No description'}</p>
                                </div>
                                <button
                                    onClick={() => toggleTestStatus(test.id, test.is_active)}
                                    className={`ml-2 p-2 rounded-lg transition ${test.is_active
                                            ? 'text-green-600 hover:bg-green-50'
                                            : 'text-gray-400 hover:bg-gray-50'
                                        }`}
                                    title={test.is_active ? 'Deactivate' : 'Activate'}
                                >
                                    {test.is_active ? <Power size={20} /> : <PowerOff size={20} />}
                                </button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Type:</span>
                                    <span className="font-medium text-gray-900 capitalize">{test.type}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Duration:</span>
                                    <span className="font-medium text-gray-900">{test.duration_minutes} min</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Status:</span>
                                    <StatusBadge active={test.is_active} />
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Created:</span>
                                    <span className="text-gray-500">{new Date(test.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Available Test Types */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <h4 className="font-medium text-blue-800">Strength 360</h4>
                    <p className="text-sm text-blue-600 mt-1">Psychometric Assessment</p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${
                        tests.some(t => t.type === 'psychometric' && t.is_active) 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                    }`}>
                        {tests.some(t => t.type === 'psychometric' && t.is_active) ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                    <h4 className="font-medium text-purple-800">Beyonders Science</h4>
                    <p className="text-sm text-purple-600 mt-1">Science Stream Assessment</p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${
                        tests.some(t => t.type === 'beyonders_science' && t.is_active) 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                    }`}>
                        {tests.some(t => t.type === 'beyonders_science' && t.is_active) ? 'Active' : 'Inactive'}
                    </span>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <h4 className="font-medium text-green-800">Beyonders Non-Science</h4>
                    <p className="text-sm text-green-600 mt-1">Non-Science Stream Assessment</p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${
                        tests.some(t => t.type === 'beyonders_non_science' && t.is_active) 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                    }`}>
                        {tests.some(t => t.type === 'beyonders_non_science' && t.is_active) ? 'Active' : 'Inactive'}
                    </span>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <CreateTestModal
                    token={token}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => {
                        setShowCreateModal(false);
                        fetchTests();
                    }}
                />
            )}
        </div>
    );
}

function StatusBadge({ active }: { active: boolean }) {
    return (
        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

function CreateTestModal({ token, onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: 'psychometric',
        durationMinutes: 20,
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch(`${API_URL}/api/admin/tests`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (data.success) {
                alert('Test created successfully!');
                onSuccess();
            } else {
                alert(data.error || 'Failed to create test');
            }
        } catch (error) {
            alert('Failed to create test');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Create New Test</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Test Title *
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                            placeholder="e.g., Strength 360 Assessment"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                            placeholder="Brief description of the test..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Test Type *
                        </label>
                        <select
                            required
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        >
                            <option value="psychometric">Psychometric</option>
                            <option value="adaptive">Adaptive</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Duration (minutes) *
                        </label>
                        <input
                            type="number"
                            required
                            min="1"
                            value={formData.durationMinutes}
                            onChange={(e) => setFormData({ ...formData, durationMinutes: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                        >
                            {submitting ? 'Creating...' : 'Create Test'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}



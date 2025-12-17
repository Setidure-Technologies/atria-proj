import React, { useState, useEffect } from 'react';
import { Send, Users as UsersIcon, FileText, RefreshCw, Filter } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4902';

interface Assignment {
    id: string;
    user_name: string;
    user_email: string;
    test_title: string;
    status: string;
    assigned_at: string;
    due_at?: string;
    started_at?: string;
    submitted_at?: string;
}

interface Test {
    id: string;
    title: string;
    type: string;
    is_active: boolean;
}

interface User {
    id: string;
    name: string;
    email: string;
}

interface AssignmentManagementProps {
    token: string;
}

export function AssignmentManagement({ token }: AssignmentManagementProps) {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [tests, setTests] = useState<Test[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);

    useEffect(() => {
        fetchAssignments();
        fetchTests();
        fetchUsers();
    }, []);

    const fetchAssignments = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/assignments`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setAssignments(data.assignments);
            }
        } catch (error) {
            console.error('Failed to fetch assignments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchTests = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/tests?isActive=true`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setTests(data.tests);
            }
        } catch (error) {
            console.error('Failed to fetch tests:', error);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setUsers(data.users);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    const handleResendLink = async (assignmentId: string) => {
        if (!confirm('Resend test link to this user?')) return;

        try {
            const response = await fetch(`${API_URL}/api/admin/assignments/${assignmentId}/resend`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            const data = await response.json();
            if (data.success) {
                alert('Link resent successfully!');
            } else {
                alert(data.error || 'Failed to resend link');
            }
        } catch (error) {
            alert('Failed to resend link');
        }
    };

    const filteredAssignments = statusFilter === 'all'
        ? assignments
        : assignments.filter(a => a.status === statusFilter);

    if (loading) {
        return <div className="text-center py-12">Loading assignments...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">Assignment Management</h2>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowBulkModal(true)}
                        className="flex items-center gap-2 px-4 py-2 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50 transition"
                    >
                        <UsersIcon size={18} />
                        <span>Bulk Assign</span>
                    </button>
                    <button
                        onClick={() => setShowAssignModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition"
                    >
                        <Send size={18} />
                        <span>Assign Test</span>
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard title="Total" count={assignments.length} color="bg-gray-50" />
                <StatCard title="Assigned" count={assignments.filter(a => a.status === 'assigned').length} color="bg-yellow-50" />
                <StatCard title="Started" count={assignments.filter(a => a.status === 'started').length} color="bg-blue-50" />
                <StatCard title="Submitted" count={assignments.filter(a => a.status === 'submitted').length} color="bg-green-50" />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
                <Filter size={18} className="text-gray-500" />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                >
                    <option value="all">All Statuses</option>
                    <option value="assigned">Assigned</option>
                    <option value="started">Started</option>
                    <option value="submitted">Submitted</option>
                    <option value="expired">Expired</option>
                </select>
            </div>

            {/* Assignments Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Test</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredAssignments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No assignments found
                                    </td>
                                </tr>
                            ) : (
                                filteredAssignments.map((assignment) => (
                                    <tr key={assignment.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{assignment.user_name}</div>
                                            <div className="text-sm text-gray-500">{assignment.user_email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{assignment.test_title}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <AssignmentStatusBadge status={assignment.status} />
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(assignment.assigned_at).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <ProgressIndicator assignment={assignment} />
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleResendLink(assignment.id)}
                                                className="text-orange-600 hover:text-orange-900"
                                                title="Resend link"
                                            >
                                                <RefreshCw size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            {showAssignModal && (
                <AssignTestModal
                    token={token}
                    tests={tests}
                    users={users}
                    onClose={() => setShowAssignModal(false)}
                    onSuccess={() => {
                        setShowAssignModal(false);
                        fetchAssignments();
                    }}
                />
            )}

            {showBulkModal && (
                <BulkAssignModal
                    token={token}
                    tests={tests}
                    users={users}
                    onClose={() => setShowBulkModal(false)}
                    onSuccess={() => {
                        setShowBulkModal(false);
                        fetchAssignments();
                    }}
                />
            )}
        </div>
    );
}

function StatCard({ title, count, color }: any) {
    return (
        <div className={`${color} rounded-lg p-4`}>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{count}</p>
        </div>
    );
}

function AssignmentStatusBadge({ status }: { status: string }) {
    const colors = {
        assigned: 'bg-yellow-100 text-yellow-800',
        started: 'bg-blue-100 text-blue-800',
        submitted: 'bg-green-100 text-green-800',
        expired: 'bg-red-100 text-red-800',
    };

    return (
        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[status as keyof typeof colors] || colors.assigned}`}>
            {status}
        </span>
    );
}

function ProgressIndicator({ assignment }: { assignment: Assignment }) {
    if (assignment.status === 'submitted') {
        return <span className="text-sm text-green-600">✓ Complete</span>;
    }
    if (assignment.status === 'started') {
        return <span className="text-sm text-blue-600">In Progress</span>;
    }
    return <span className="text-sm text-gray-500">Not Started</span>;
}

// Assign Test Modal
function AssignTestModal({ token, tests, users, onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        testId: '',
        userId: '',
        dueAt: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const response = await fetch(`${API_URL}/api/admin/assignments`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (data.success) {
                alert('Test assigned successfully! Email sent to user.');
                onSuccess();
            } else {
                alert(data.error || 'Failed to assign test');
            }
        } catch (error) {
            alert('Failed to assign test');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Assign Test</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Test *
                        </label>
                        <select
                            required
                            value={formData.testId}
                            onChange={(e) => setFormData({ ...formData, testId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        >
                            <option value="">-- Select a test --</option>
                            {tests.map((test: Test) => (
                                <option key={test.id} value={test.id}>
                                    {test.title} ({test.type})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select User *
                        </label>
                        <select
                            required
                            value={formData.userId}
                            onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        >
                            <option value="">-- Select a user --</option>
                            {users.map((user: User) => (
                                <option key={user.id} value={user.id}>
                                    {user.name} ({user.email})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Due Date (Optional)
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.dueAt}
                            onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
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
                            {submitting ? 'Assigning...' : 'Assign Test'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Bulk Assign Modal
function BulkAssignModal({ token, tests, users, onClose, onSuccess }: any) {
    const [formData, setFormData] = useState({
        testId: '',
        userIds: [] as string[],
        dueAt: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const toggleUser = (userId: string) => {
        setFormData(prev => ({
            ...prev,
            userIds: prev.userIds.includes(userId)
                ? prev.userIds.filter(id => id !== userId)
                : [...prev.userIds, userId]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.userIds.length === 0) {
            alert('Please select at least one user');
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch(`${API_URL}/api/admin/assignments/bulk`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (data.success) {
                const { created, failed, duplicates } = data.results;
                alert(`Bulk assignment complete!\nCreated: ${created.length}\nFailed: ${failed.length}\nDuplicates: ${duplicates.length}`);
                onSuccess();
            } else {
                alert(data.error || 'Failed to assign tests');
            }
        } catch (error) {
            alert('Failed to assign tests');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Bulk Assign Test</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Test *
                        </label>
                        <select
                            required
                            value={formData.testId}
                            onChange={(e) => setFormData({ ...formData, testId: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        >
                            <option value="">-- Select a test --</option>
                            {tests.map((test: Test) => (
                                <option key={test.id} value={test.id}>
                                    {test.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Select Users * ({formData.userIds.length} selected)
                        </label>
                        <div className="border border-gray-300 rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                            {users.map((user: User) => (
                                <label key={user.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.userIds.includes(user.id)}
                                        onChange={() => toggleUser(user.id)}
                                        className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                                    />
                                    <span className="text-sm">{user.name} ({user.email})</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Due Date (Optional)
                        </label>
                        <input
                            type="datetime-local"
                            value={formData.dueAt}
                            onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
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
                            {submitting ? 'Assigning...' : `Assign to ${formData.userIds.length} Users`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

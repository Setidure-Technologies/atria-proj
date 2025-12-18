import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiDB } from './lib/apiDatabase';

interface Assignment {
    id: string;
    title: string;
    description: string;
    type: string;
    engineType?: string;
    testSlug?: string;
    runner?: string;
    status: string;
    due_at: string | null;
    duration_minutes: number;
}

export default function Dashboard() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('candidate_token');
        if (!token) {
            navigate('/login');
            return;
        }

        fetchAssignments(token);
    }, [navigate]);

    const fetchAssignments = async (token: string) => {
        try {
            const result = await apiDB.getAssignments(token);
            if (result.success) {
                console.log('📋 Dashboard - Assignments loaded:', result.assignments);
                setAssignments(result.assignments);
            } else {
                setError(result.error || 'Failed to load assignments');
                if (result.error === 'Invalid or expired token') {
                    localStorage.removeItem('candidate_token');
                    navigate('/login');
                }
            }
        } catch (err) {
            setError('Failed to load assignments');
        } finally {
            setLoading(false);
        }
    };

    const startTest = (assignmentId: string) => {
        // Clear any stale localStorage state before starting
        localStorage.removeItem(`test_progress_${assignmentId}`);
        navigate(`/test/${assignmentId}`);
    };

    const viewReport = (assignmentId: string) => {
        // Navigate to results page (to be implemented)
        navigate(`/results/${assignmentId}`);
    };

    const handleLogout = () => {
        localStorage.removeItem('candidate_token');
        localStorage.removeItem('candidate_user');
        navigate('/login');
    };

    const getTestTypeDisplay = (assignment: Assignment) => {
        const slug = assignment.testSlug || assignment.type;

        if (slug === 'beyonders_science') return 'Beyonders Science Assessment';
        if (slug === 'beyonders_non_science') return 'Beyonders Non-Science Assessment';
        if (slug === 'strength360') return 'Psychometric Assessment';
        if (slug === 'adaptive') return 'Adaptive Assessment';
        if (slug === 'psychometric') return 'Psychometric Assessment';
        if (slug === 'custom') return 'Custom Assessment';

        return assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1) + ' Assessment';
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <nav className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-xl font-bold text-gray-900">Candidate Portal</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/profile')}
                                className="text-gray-600 hover:text-gray-900 font-medium"
                            >
                                Profile
                            </button>
                            <button
                                onClick={handleLogout}
                                className="text-gray-600 hover:text-gray-900 font-medium"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                <div className="px-4 py-6 sm:px-0">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Your Assessments</h2>

                    {error && (
                        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <span className="text-red-400">⚠️</span>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {assignments.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg shadow">
                            <p className="text-gray-500 text-lg">No assessments assigned yet.</p>
                        </div>
                    ) : (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {assignments.map((assignment) => (
                                <div key={assignment.id} className="bg-white overflow-hidden shadow rounded-lg divide-y divide-gray-200">
                                    <div className="px-4 py-5 sm:px-6">
                                        <h3 className="text-lg font-medium text-gray-900 truncate">
                                            {assignment.title}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {getTestTypeDisplay(assignment)}
                                        </p>
                                    </div>
                                    <div className="px-4 py-5 sm:p-6">
                                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                                            {assignment.description || 'No description available.'}
                                        </p>
                                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                                            <span>Duration: {assignment.duration_minutes} mins</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${assignment.status === 'completed' || assignment.status === 'submitted'
                                                ? 'bg-green-100 text-green-800'
                                                : assignment.status === 'started'
                                                    ? 'bg-yellow-100 text-yellow-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {assignment.status.toUpperCase()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="px-4 py-4 sm:px-6">
                                        {assignment.status === 'submitted' ? (
                                            <button
                                                onClick={() => viewReport(assignment.id)}
                                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                            >
                                                View Report
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => startTest(assignment.id)}
                                                disabled={assignment.status === 'expired'}
                                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                            >
                                                {assignment.status === 'started' ? 'Resume Test' : 'Start Test'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

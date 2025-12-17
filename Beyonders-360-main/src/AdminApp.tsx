import React, { useState, useEffect } from 'react';
import { Shield, Users, FileText, Send, BarChart3, LogOut, Menu, X, Upload } from 'lucide-react';
import { UserManagement } from './components/UserManagement';
import { TestManagement } from './components/TestManagement';
import { AssignmentManagement } from './components/AssignmentManagement';
import { ResponseViewer } from './components/ResponseViewer';
import { BulkManagement } from './components/BulkManagement';

// API Configuration
const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:4902';

// Types
interface User {
    id: string;
    email: string;
    name: string;
    roles: string[];
}

interface DashboardStats {
    totalUsers: number;
    totalTests: number;
    totalAssignments: number;
    completedTests: number;
    pendingTests: number;
    domainBreakdown: Record<string, number>;
}

type View = 'dashboard' | 'users' | 'tests' | 'assignments' | 'responses' | 'bulk';

function AdminApp() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Check for existing token on mount
    useEffect(() => {
        const storedToken = localStorage.getItem('atria_admin_token');
        if (storedToken) {
            verifyToken(storedToken);
        }
    }, []);

    const verifyToken = async (tkn: string) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${tkn}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                if (data.success && data.user.roles?.includes('ADMIN')) {
                    setUser(data.user);
                    setToken(tkn);
                    setIsAuthenticated(true);
                } else {
                    localStorage.removeItem('atria_admin_token');
                }
            } else {
                localStorage.removeItem('atria_admin_token');
            }
        } catch (error) {
            console.error('Token verification failed:', error);
            localStorage.removeItem('atria_admin_token');
        }
    };

    const handleLogin = async (email: string, password: string) => {
        try {
            const response = await fetch(`${API_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (data.success && data.token) {
                setToken(data.token);
                setUser(data.user);
                setIsAuthenticated(true);
                localStorage.setItem('atria_admin_token', data.token);
            } else {
                alert(data.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed. Please check your connection.');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        localStorage.removeItem('atria_admin_token');
        setCurrentView('dashboard');
    };

    if (!isAuthenticated) {
        return <LoginPage onLogin={handleLogin} />;
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-gradient-to-r from-orange-600 to-orange-500 text-white shadow-lg">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-3">
                            <img
                                src="/peop360_logo_powered.jpeg"
                                alt="ATRIA 360"
                                className="h-10 w-auto bg-white rounded px-2 py-1"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                            <div>
                                <h1 className="text-2xl font-bold">ATRIA 360</h1>
                                <p className="text-sm text-orange-100">Admin Portal</p>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-sm font-medium">{user?.name}</p>
                                <p className="text-xs text-orange-100">{user?.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 bg-orange-700 hover:bg-orange-800 px-4 py-2 rounded-lg transition"
                            >
                                <LogOut size={18} />
                                <span>Logout</span>
                            </button>
                        </div>

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2"
                        >
                            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col md:flex-row gap-6">
                    {/* Sidebar */}
                    <aside className={`md:w-64 ${mobileMenuOpen ? 'block' : 'hidden md:block'}`}>
                        <nav className="bg-white rounded-lg shadow-md p-4 space-y-2">
                            <NavItem
                                icon={<BarChart3 size={20} />}
                                label="Dashboard"
                                active={currentView === 'dashboard'}
                                onClick={() => {
                                    setCurrentView('dashboard');
                                    setMobileMenuOpen(false);
                                }}
                            />
                            <NavItem
                                icon={<Users size={20} />}
                                label="Users"
                                active={currentView === 'users'}
                                onClick={() => {
                                    setCurrentView('users');
                                    setMobileMenuOpen(false);
                                }}
                            />
                            <NavItem
                                icon={<FileText size={20} />}
                                label="Tests"
                                active={currentView === 'tests'}
                                onClick={() => {
                                    setCurrentView('tests');
                                    setMobileMenuOpen(false);
                                }}
                            />
                            <NavItem
                                icon={<Send size={20} />}
                                label="Assignments"
                                active={currentView === 'assignments'}
                                onClick={() => {
                                    setCurrentView('assignments');
                                    setMobileMenuOpen(false);
                                }}
                            />
                            <NavItem
                                icon={<Shield size={20} />}
                                label="Responses"
                                active={currentView === 'responses'}
                                onClick={() => {
                                    setCurrentView('responses');
                                    setMobileMenuOpen(false);
                                }}
                            />
                            <NavItem
                                icon={<Upload size={20} />}
                                label="Bulk Operations"
                                active={currentView === 'bulk'}
                                onClick={() => {
                                    setCurrentView('bulk');
                                    setMobileMenuOpen(false);
                                }}
                            />
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        {currentView === 'dashboard' && <Dashboard token={token!} />}
                        {currentView === 'users' && <UserManagement token={token!} />}
                        {currentView === 'tests' && <TestManagement token={token!} />}
                        {currentView === 'assignments' && <AssignmentManagement token={token!} />}
                        {currentView === 'responses' && <ResponseViewer token={token!} />}
                        {currentView === 'bulk' && <BulkManagement token={token!} />}
                    </main>
                </div>
            </div>
        </div>
    );
}

// Navigation Item Component
function NavItem({ icon, label, active, onClick }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition ${active
                ? 'bg-orange-50 text-orange-600 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}

// Login Page Component
function LoginPage({ onLogin }: { onLogin: (email: string, password: string) => void }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(email, password);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <img
                            src="/peop360_logo_powered.jpeg"
                            alt="ATRIA 360"
                            className="h-16 w-auto"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">ATRIA 360</h1>
                    <p className="text-gray-600">Admin Portal Login</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                            placeholder="admin@atria360.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                            placeholder="Enter your password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 rounded-lg transition duration-200 shadow-md hover:shadow-lg"
                    >
                        Sign In
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>Default credentials: admin@atria360.com / admin123</p>
                </div>
            </div>
        </div>
    );
}

// Dashboard Component
function Dashboard({ token }: { token: string }) {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_URL}/api/admin/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const data = await response.json();
            if (data.success) {
                setStats(data.stats);
            }
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-12">Loading dashboard...</div>;
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    icon={<Users className="text-blue-600" size={24} />}
                    bgColor="bg-blue-50"
                />
                <StatCard
                    title="Total Tests"
                    value={stats?.totalTests || 0}
                    icon={<FileText className="text-green-600" size={24} />}
                    bgColor="bg-green-50"
                />
                <StatCard
                    title="Completed"
                    value={stats?.completedTests || 0}
                    icon={<Shield className="text-purple-600" size={24} />}
                    bgColor="bg-purple-50"
                />
                <StatCard
                    title="Pending"
                    value={stats?.pendingTests || 0}
                    icon={<Send className="text-orange-600" size={24} />}
                    bgColor="bg-orange-50"
                />
            </div>

            {/* Domain Breakdown */}
            {stats?.domainBreakdown && Object.keys(stats.domainBreakdown).length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Talent Domain Breakdown
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(stats.domainBreakdown).map(([domain, count]) => (
                            <div key={domain} className="flex items-center justify-between">
                                <span className="text-gray-700">{domain}</span>
                                <span className="font-semibold text-orange-600">{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ title, value, icon, bgColor }: any) {
    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-gray-900">{value}</p>
                </div>
                <div className={`${bgColor} p-3 rounded-lg`}>{icon}</div>
            </div>
        </div>
    );
}

export default AdminApp;

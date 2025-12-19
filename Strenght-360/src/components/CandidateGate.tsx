import { useState, useEffect } from 'react';
import { StudentInfo } from './StudentInfo';
import Dashboard from '../Dashboard';
import { apiDB } from '../lib/apiDatabase';

interface UserInfo {
    name: string;
    email: string;
}

export default function CandidateGate() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [needsProfile, setNeedsProfile] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkProfile();
    }, []);

    const checkProfile = async () => {
        console.log('🔍 CandidateGate: Checking profile...');

        // First verify we have a token
        const token = localStorage.getItem('candidate_token');
        if (!token) {
            console.error('❌ No token found in localStorage');
            setError('Not logged in. Please login first.');
            setLoading(false);
            return;
        }
        console.log('✅ Token found:', token.substring(0, 20) + '...');

        // Get user info from localStorage
        const userStr = localStorage.getItem('candidate_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                setUserInfo(user);
                console.log('✅ User info:', user);
            } catch (e) {
                console.warn('Could not parse user info');
            }
        }

        try {
            const res = await apiDB.getProfile();
            console.log('📋 Profile response:', res);

            if (res.exists && res.is_completed) {
                console.log('✅ Profile completed, showing Dashboard');
                setNeedsProfile(false);
            } else {
                console.log('⚠️ Profile incomplete or missing, showing form');
                setNeedsProfile(true);
                if (res.exists && res.profile) {
                    console.log('📝 Loading existing partial profile data');
                    setProfileData(res.profile);
                }
            }
        } catch (error: any) {
            console.error('❌ Profile check failed:', error);
            // If 404 or error, assume profile needed
            setNeedsProfile(true);
        } finally {
            setLoading(false);
        }
    };

    const handleStart = async (name: string, email: string, studentData: any) => {
        console.log('💾 CandidateGate: Saving profile...');
        console.log('📦 Profile data:', { name, email, ...studentData });

        setSaving(true);
        setError(null);

        try {
            const result = await apiDB.saveProfile({ ...studentData, name, email });
            console.log('📋 Save result:', result);

            if (result.success) {
                console.log('✅ Profile saved successfully!');
                setNeedsProfile(false);
            } else {
                console.error('❌ Profile save returned error:', result);
                setError(result.error || 'Failed to save profile. Please try again.');
            }
        } catch (error: any) {
            console.error('❌ Profile save exception:', error);
            setError(error.message || 'Failed to save profile. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading your profile...</p>
                </div>
            </div>
        );
    }

    if (error && !needsProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
                    <p className="text-gray-600 mb-4">{error}</p>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    if (needsProfile) {
        return (
            <div>
                {/* Profile Completion Banner */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 text-center">
                    <p className="text-sm md:text-base">
                        {userInfo?.name ? (
                            <>👋 Welcome, <strong>{userInfo.name}</strong>! </>
                        ) : (
                            <>👋 Welcome! </>
                        )}
                        Complete your profile to access your assigned tests.
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mx-4 mt-4">
                        <div className="flex">
                            <div className="flex-shrink-0">❌</div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Saving Overlay */}
                {saving && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white p-6 rounded-xl shadow-xl text-center">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                            <p className="text-gray-700 font-medium">Saving your profile...</p>
                        </div>
                    </div>
                )}

                <StudentInfo onStart={handleStart} initialData={profileData} />
            </div>
        );
    }

    return <Dashboard />;
}

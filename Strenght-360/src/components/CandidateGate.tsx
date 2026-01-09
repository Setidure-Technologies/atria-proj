import { useState, useEffect } from 'react';
import { StudentInfo } from './StudentInfo';
import Dashboard from '../Dashboard';
import { apiDB } from '../lib/apiDatabase';

interface UserInfo {
    name: string;
    email: string;
    phone?: string;
}

interface VerificationStatus {
    emailVerified: boolean;
    profileCompleted: boolean;
    canTakeTests: boolean;
}

export default function CandidateGate() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [needsProfile, setNeedsProfile] = useState(false);
    const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);
    const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [otp, setOtp] = useState('');
    const [verifying, setVerifying] = useState(false);

    useEffect(() => {
        checkStatus();
    }, []);

    const checkStatus = async () => {
        console.log('🔍 CandidateGate: Checking verification status...');

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
            // First check verification status from backend
            const statusRes = await apiDB.getCandidateStatus();
            console.log('📋 Verification status:', statusRes);

            if (statusRes.success && statusRes.status) {
                const status: VerificationStatus = statusRes.status;

                // Check email verification
                if (!status.emailVerified) {
                    console.log('⚠️ Email not verified');
                    setNeedsEmailVerification(true);
                    setLoading(false);
                    return;
                }

                // Email is verified
                setNeedsEmailVerification(false);

                // Check profile completion
                if (!status.profileCompleted) {
                    console.log('⚠️ Profile not completed');
                    setNeedsProfile(true);

                    // Try to load existing partial profile
                    try {
                        const profileRes = await apiDB.getProfile();
                        if (profileRes.exists && profileRes.profile) {
                            setProfileData(profileRes.profile);
                        }
                    } catch (e) {
                        console.warn('Could not load existing profile');
                    }

                    setLoading(false);
                    return;
                }

                // All checks passed
                console.log('✅ All verifications passed, showing Dashboard');
                setNeedsProfile(false);
                setNeedsEmailVerification(false);
            } else {
                // Fallback to profile-only check if status endpoint fails
                const res = await apiDB.getProfile();
                console.log('📋 Profile response:', res);

                if (res.exists && res.is_completed) {
                    setNeedsProfile(false);
                } else {
                    setNeedsProfile(true);
                    if (res.exists && res.profile) {
                        setProfileData(res.profile);
                    }
                }
            }
        } catch (error: any) {
            console.error('❌ Status check failed:', error);
            // If error, assume profile needed
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

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userInfo?.email || otp.length !== 6) return;

        setVerifying(true);
        setError(null);

        try {
            const result = await apiDB.verifyOTP(userInfo.email, otp);
            if (result.success) {
                // Success! Refresh status to show dashboard
                await checkStatus();
            } else {
                setError(result.error || 'Invalid verification code');
            }
        } catch (error: any) {
            setError(error.message || 'Verification failed. Please try again.');
        } finally {
            setVerifying(false);
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

    if (error && !needsProfile && !needsEmailVerification) {
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

    // Email verification required screen
    if (needsEmailVerification) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
                    <div className="text-center mb-6">
                        <div className="text-5xl mb-4">📧</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verification Required</h2>
                        <p className="text-gray-600">
                            Please verify your email address to access your tests.
                        </p>
                        {userInfo?.email && (
                            <p className="text-sm text-gray-500 mt-2">
                                Verification email sent to: <strong>{userInfo.email}</strong>
                            </p>
                        )}
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                        <div className="flex items-start">
                            <span className="text-yellow-500 mr-2">⚠️</span>
                            <div className="text-sm text-yellow-700">
                                <p className="font-medium">Check your inbox</p>
                                <p>Look for an email with your verification code. Check spam folder if not found.</p>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handleVerifyOTP} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                required
                                maxLength={6}
                                className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                placeholder="• • • • • •"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={verifying || otp.length !== 6}
                            className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {verifying ? 'Verifying...' : 'Verify Email'}
                        </button>

                        <button
                            type="button"
                            onClick={async () => {
                                if (userInfo?.email) {
                                    const result = await apiDB.sendOTP(userInfo.email);
                                    if (result.success) {
                                        alert('Verification code sent to your email!');
                                    } else {
                                        alert(result.error || 'Failed to send code');
                                    }
                                }
                            }}
                            className="w-full py-3 px-4 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all"
                        >
                            Resend Verification Code
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                localStorage.removeItem('candidate_token');
                                localStorage.removeItem('candidate_user');
                                window.location.href = '/login';
                            }}
                            className="w-full py-2 text-gray-500 text-sm font-medium hover:underline transition-all"
                        >
                            Sign Out
                        </button>
                    </form>
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

                <StudentInfo
                    onStart={handleStart}
                    initialData={{
                        ...profileData,
                        // Merge userInfo if available and not already in profileData
                        name: profileData?.name || userInfo?.name || '',
                        email: profileData?.email || userInfo?.email || '',
                        phone: profileData?.phone || userInfo?.phone || '', // This fixes the phone redundancy
                    }}
                />
            </div>
        );
    }

    return <Dashboard />;
}

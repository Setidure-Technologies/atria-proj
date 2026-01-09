import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || '';

type Step = 'verify-token' | 'user-details' | 'otp-verification' | 'complete';

export default function Signup() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');

    const [step, setStep] = useState<Step>('verify-token');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Token verification data
    const [tokenEmail, setTokenEmail] = useState('');

    // User details form
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // OTP
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);

    // Verify invitation token on mount
    useEffect(() => {
        if (!token) {
            setError('No invitation token provided. Please use the link from your invitation email.');
            return;
        }
        verifyToken();
    }, [token]);

    // Countdown timer for OTP resend
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    const verifyToken = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/api/auth/verify-invitation`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token }),
            });
            const data = await res.json();
            if (data.success) {
                setTokenEmail(data.email);
                setStep('user-details');
            } else {
                setError(data.error || 'Invalid or expired invitation link');
            }
        } catch (err) {
            setError('Failed to verify invitation. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        try {
            // Register the user
            const payload: any = { token, name, phone, password };
            if (tokenEmail === 'public-signup') {
                payload.email = email;
            }

            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();

            if (data.success) {
                // Store token for OTP verification
                localStorage.setItem('candidate_token', data.token);
                localStorage.setItem('candidate_user', JSON.stringify(data.user));

                // Send OTP for email verification
                await sendOTP();
                setStep('otp-verification');
            } else {
                setError(data.error || 'Registration failed');
            }
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const sendOTP = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`${API_URL}/api/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: tokenEmail === 'public-signup' ? email : tokenEmail }),
            });
            const data = await res.json();
            if (data.success) {
                setOtpSent(true);
                setResendTimer(60); // 60 second cooldown
            } else {
                setError(data.error || 'Failed to send verification code');
            }
        } catch (err) {
            setError('Failed to send verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_URL}/api/auth/verify-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: tokenEmail === 'public-signup' ? email : tokenEmail,
                    code: otp
                }),
            });
            const data = await res.json();

            if (data.success) {
                setStep('complete');
                // Redirect to dashboard after a short delay
                setTimeout(() => {
                    navigate('/dashboard');
                }, 2000);
            } else {
                setError(data.error || 'Invalid verification code');
            }
        } catch (err) {
            setError('Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8">
                {/* Atria Logo and Header */}
                <div className="text-center mb-6">
                    <div className="flex justify-center mb-4">
                        <img
                            src="/candidate/atria-logo.jpg"
                            alt="Atria University"
                            className="h-14 md:h-16 w-auto"
                        />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Student Registration</h2>
                </div>

                {/* Progress Steps */}
                <div className="flex justify-center mb-8">
                    <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'otp-verification' || step === 'complete' ? 'bg-[#00C853] text-white' : 'bg-[#3B4DC9] text-white'
                            }`}>
                            {step === 'otp-verification' || step === 'complete' ? '✓' : '1'}
                        </div>
                        <div className="w-12 h-1 bg-gray-200" />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'complete' ? 'bg-[#00C853] text-white' :
                                step === 'otp-verification' ? 'bg-[#3B4DC9] text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                            {step === 'complete' ? '✓' : '2'}
                        </div>
                        <div className="w-12 h-1 bg-gray-200" />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step === 'complete' ? 'bg-[#00C853] text-white' : 'bg-gray-200 text-gray-500'
                            }`}>
                            {step === 'complete' ? '✓' : '3'}
                        </div>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                        {error}
                    </div>
                )}

                {/* Step: Verify Token */}
                {step === 'verify-token' && (
                    <div className="text-center">
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B4DC9] mx-auto" />
                                <p className="mt-4 text-gray-600">Verifying invitation...</p>
                            </>
                        ) : error ? (
                            <div>
                                <p className="text-gray-600 mb-4">Please check your invitation link and try again.</p>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="text-[#3B4DC9] hover:underline"
                                >
                                    Go to Login
                                </button>
                            </div>
                        ) : null}
                    </div>
                )}

                {/* Step: User Details */}
                {step === 'user-details' && (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="text-center mb-4">
                            <p className="text-gray-600">Complete your registration</p>
                            {tokenEmail !== 'public-signup' && (
                                <p className="text-sm text-gray-500">for {tokenEmail}</p>
                            )}
                        </div>

                        {tokenEmail === 'public-signup' && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B4DC9] focus:border-transparent outline-none transition-all"
                                    placeholder="Enter your email"
                                />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B4DC9] focus:border-transparent outline-none transition-all"
                                placeholder="Enter your full name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B4DC9] focus:border-transparent outline-none transition-all"
                                placeholder="Enter your phone number"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B4DC9] focus:border-transparent outline-none transition-all"
                                placeholder="Create a password"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B4DC9] focus:border-transparent outline-none transition-all"
                                placeholder="Confirm your password"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-[#3B4DC9] text-white font-medium rounded-lg hover:bg-[#2E3DA1] focus:ring-4 focus:ring-blue-200 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>
                )}

                {/* Step: OTP Verification */}
                {step === 'otp-verification' && (
                    <form onSubmit={handleVerifyOTP} className="space-y-4">
                        <div className="text-center mb-4">
                            <p className="text-gray-600">Verify your email</p>
                            <p className="text-sm text-gray-500">
                                We sent a verification code to <strong>{tokenEmail === 'public-signup' ? email : tokenEmail}</strong>
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Verification Code</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                required
                                maxLength={6}
                                className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="• • • • • •"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="w-full py-3 px-4 bg-[#3B4DC9] text-white font-medium rounded-lg hover:bg-[#2E3DA1] focus:ring-4 focus:ring-blue-200 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Verifying...' : 'Verify Email'}
                        </button>

                        <div className="text-center">
                            {resendTimer > 0 ? (
                                <p className="text-sm text-gray-500">
                                    Resend code in {resendTimer}s
                                </p>
                            ) : (
                                <button
                                    type="button"
                                    onClick={sendOTP}
                                    disabled={loading}
                                    className="text-[#3B4DC9] hover:underline text-sm"
                                >
                                    Didn't receive code? Resend
                                </button>
                            )}
                        </div>
                    </form>
                )}

                {/* Step: Complete */}
                {step === 'complete' && (
                    <div className="text-center">
                        <div className="text-5xl mb-4">🎉</div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">Account Created!</h2>
                        <p className="text-gray-600 mb-4">
                            Your email has been verified. Redirecting to dashboard...
                        </p>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3B4DC9] mx-auto" />
                    </div>
                )}

                {/* Login link */}
                {step !== 'complete' && (
                    <div className="mt-6 text-center">
                        <span className="text-gray-600 text-sm">Already have an account? </span>
                        <button
                            onClick={() => navigate('/login')}
                            className="text-[#3B4DC9] hover:underline text-sm font-medium"
                        >
                            Sign in
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

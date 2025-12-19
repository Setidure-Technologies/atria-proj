import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiDB } from './lib/apiDatabase';
import { MapPin } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4902';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied' | 'unavailable'>('pending');
    const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
    const navigate = useNavigate();

    // Request location on component mount
    useEffect(() => {
        requestLocation();
    }, []);

    const requestLocation = () => {
        if (!navigator.geolocation) {
            setLocationStatus('unavailable');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCurrentLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                });
                setLocationStatus('granted');
            },
            (error) => {
                console.log('Location error:', error);
                setLocationStatus('denied');
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const storeLoginLocation = async (token: string) => {
        if (!currentLocation) return;

        try {
            // Try to get address from coordinates (optional reverse geocoding)
            let address = null;
            try {
                const geoRes = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLocation.lat}&lon=${currentLocation.lng}`
                );
                const geoData = await geoRes.json();
                if (geoData.display_name) {
                    address = geoData.display_name;
                }
            } catch (e) {
                console.log('Reverse geocoding failed, using coordinates only');
            }

            // Store location
            await fetch(`${API_URL}/api/auth/location`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    latitude: currentLocation.lat,
                    longitude: currentLocation.lng,
                    address
                })
            });
        } catch (e) {
            console.log('Location storage failed:', e);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await apiDB.login(email, password);
            if (result.success) {
                localStorage.setItem('candidate_token', result.token);
                localStorage.setItem('candidate_user', JSON.stringify(result.user));

                // Store location after successful login
                await storeLoginLocation(result.token);

                navigate('/dashboard');
            } else {
                setError(result.error || 'Login failed');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Access your assigned assessments
                    </p>
                </div>

                {/* Location Status Indicator */}
                <div className={`flex items-center justify-center gap-2 text-sm py-2 px-4 rounded-lg ${locationStatus === 'granted'
                        ? 'bg-green-100 text-green-800'
                        : locationStatus === 'denied'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-600'
                    }`}>
                    <MapPin size={16} />
                    {locationStatus === 'granted' && (
                        <span>Location captured: {currentLocation?.lat.toFixed(4)}, {currentLocation?.lng.toFixed(4)}</span>
                    )}
                    {locationStatus === 'denied' && (
                        <span>Location access denied - Please enable location</span>
                    )}
                    {locationStatus === 'pending' && (
                        <span>Requesting location access...</span>
                    )}
                    {locationStatus === 'unavailable' && (
                        <span>Location not available on this device</span>
                    )}
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="rounded-md shadow-sm -space-y-px">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm text-center py-2 px-4 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                </form>

                {locationStatus === 'denied' && (
                    <button
                        onClick={requestLocation}
                        className="w-full text-center text-sm text-blue-600 hover:text-blue-700"
                    >
                        Click to retry location access
                    </button>
                )}
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiDB } from './lib/apiDatabase';

export default function Profile() {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        dateOfBirth: '',
        institution: '',
        boardOfStudy: '',
        parentName: '',
        parentOccupation: '',
        annualIncome: '',
        fullAddress: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const userStr = localStorage.getItem('candidate_user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setFormData(prev => ({
                ...prev,
                name: user.name || '',
                phone: user.phone || '',
                // Other fields might not be in the initial user object, 
                // we might need to fetch full profile if we want to pre-fill
            }));
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const token = localStorage.getItem('candidate_token');
        if (!token) {
            navigate('/login');
            return;
        }

        try {
            const result = await apiDB.updateProfile(token, formData);
            if (result.success) {
                // Update local user data if needed
                const userStr = localStorage.getItem('candidate_user');
                if (userStr) {
                    const user = JSON.parse(userStr);
                    localStorage.setItem('candidate_user', JSON.stringify({ ...user, ...result.user }));
                }
                navigate('/dashboard');
            } else {
                setError(result.error || 'Failed to update profile');
            }
        } catch (err) {
            setError('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto bg-white rounded-lg shadow px-8 py-10">
                <div className="mb-8">
                    <h2 className="text-2xl font-bold text-gray-900">Complete Your Profile</h2>
                    <p className="mt-2 text-gray-600">Please provide the following details before proceeding.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                id="name"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                id="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">Date of Birth</label>
                            <input
                                type="date"
                                name="dateOfBirth"
                                id="dateOfBirth"
                                required
                                value={formData.dateOfBirth}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="institution" className="block text-sm font-medium text-gray-700">Institution / School</label>
                            <input
                                type="text"
                                name="institution"
                                id="institution"
                                required
                                value={formData.institution}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="boardOfStudy" className="block text-sm font-medium text-gray-700">Board of Study</label>
                            <input
                                type="text"
                                name="boardOfStudy"
                                id="boardOfStudy"
                                value={formData.boardOfStudy}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="parentName" className="block text-sm font-medium text-gray-700">Parent/Guardian Name</label>
                            <input
                                type="text"
                                name="parentName"
                                id="parentName"
                                value={formData.parentName}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="parentOccupation" className="block text-sm font-medium text-gray-700">Parent Occupation</label>
                            <input
                                type="text"
                                name="parentOccupation"
                                id="parentOccupation"
                                value={formData.parentOccupation}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>

                        <div>
                            <label htmlFor="annualIncome" className="block text-sm font-medium text-gray-700">Annual Income</label>
                            <input
                                type="text"
                                name="annualIncome"
                                id="annualIncome"
                                value={formData.annualIncome}
                                onChange={handleChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="fullAddress" className="block text-sm font-medium text-gray-700">Full Address</label>
                        <textarea
                            name="fullAddress"
                            id="fullAddress"
                            rows={3}
                            value={formData.fullAddress}
                            onChange={handleChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm">{error}</div>
                    )}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save & Continue'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

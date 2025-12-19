import { useState, useEffect } from 'react';
import {
    User, Mail, Phone, Calendar, Download, ArrowLeft, Award, Clock,
    MapPin, School, Briefcase, BookOpen, Activity, Edit3, Save, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiDB } from './lib/apiDatabase';

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

interface StudentProfile {
    name: string;
    email: string;
    phone: string;
    dateOfBirth?: string;
    institution?: string;
    boardOfStudy?: string;
    parentName?: string;
    parentOccupation?: string;
    annualIncome?: string;
    fullAddress?: string;
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
    tenthGrade?: {
        mathematics: string;
        physics: string;
        chemistry: string;
        biology: string;
    };
    eleventhGrade?: {
        mathematics: string;
        physics: string;
        chemistry: string;
        biology: string;
    };
    extracurricular?: {
        sports: string;
        leadership: string;
        cultural: string;
        academic: string;
        technology: string;
    };
    interests?: {
        aiMlDataScience: boolean;
        energySustainability: boolean;
        emobilityIot: boolean;
        lifeSciencesHealthcare: boolean;
        businessEntrepreneurship: boolean;
        other?: string;
    };
}

interface LoginLocation {
    latitude: number;
    longitude: number;
    address?: string;
    logged_at?: string;
}

export default function Profile() {
    const navigate = useNavigate();
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(true);
    const [loginLocation, setLoginLocation] = useState<LoginLocation | null>(null);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editedProfile, setEditedProfile] = useState<StudentProfile | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchProfileData();
    }, []);

    const fetchProfileData = async () => {
        try {
            console.log('📋 Profile: Fetching data...');

            // Use apiDB which handles token and base URL correctly
            const profileData = await apiDB.getProfile();
            console.log('📋 Profile response:', profileData);

            if (profileData.exists && profileData.profile) {
                setProfile(profileData.profile);
                setEditedProfile(profileData.profile);
            }

            // Fetch assignments
            const token = localStorage.getItem('candidate_token');
            if (token) {
                const assignData = await apiDB.getAssignments(token);
                if (assignData.success) {
                    setAssignments(assignData.assignments || []);
                }

                // Try to get login location
                try {
                    const locRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:4902'}/auth/my-location`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const locData = await locRes.json();
                    if (locData.success && locData.location) {
                        setLoginLocation(locData.location);
                    }
                } catch (e) {
                    console.log('Location fetch optional');
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setError('Failed to load profile data');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!editedProfile) return;

        setSaving(true);
        setError(null);

        try {
            const result = await apiDB.saveProfile(editedProfile);
            if (result.success) {
                setProfile(editedProfile);
                setEditing(false);
            } else {
                setError(result.error || 'Failed to save profile');
            }
        } catch (error: any) {
            setError(error.message || 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleDownloadReport = async (responseId: string, testTitle: string) => {
        try {
            await apiDB.generatePDFReport(responseId);
        } catch (error) {
            console.error('Download error:', error);
            alert('Failed to download report');
        }
    };

    const getSelectedInterests = () => {
        if (!profile?.interests) return [];
        const interestLabels: Record<string, string> = {
            aiMlDataScience: 'AI/ML & Data Science',
            energySustainability: 'Energy & Sustainability',
            emobilityIot: 'E-Mobility & IoT',
            lifeSciencesHealthcare: 'Life Sciences & Healthcare',
            businessEntrepreneurship: 'Business & Entrepreneurship'
        };
        return Object.entries(profile.interests)
            .filter(([key, value]) => value === true && key !== 'other')
            .map(([key]) => interestLabels[key] || key);
    };

    const updateEditedField = (field: string, value: string) => {
        if (!editedProfile) return;
        setEditedProfile({ ...editedProfile, [field]: value });
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="p-2 hover:bg-gray-200 rounded-full transition"
                        >
                            <ArrowLeft size={24} className="text-gray-600" />
                        </button>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">My Profile</h1>
                    </div>

                    {/* Edit Button */}
                    {!editing ? (
                        <button
                            onClick={() => setEditing(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                            <Edit3 size={18} />
                            Edit Profile
                        </button>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setEditing(false);
                                    setEditedProfile(profile);
                                }}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                            >
                                <X size={18} />
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveProfile}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                            >
                                <Save size={18} />
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    )}
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {/* Personal Info Card */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={32} className="text-blue-600" />
                        </div>
                        <div className="flex-1">
                            {editing ? (
                                <input
                                    type="text"
                                    value={editedProfile?.name || ''}
                                    onChange={(e) => updateEditedField('name', e.target.value)}
                                    className="text-xl font-bold text-gray-900 border-b-2 border-blue-500 bg-transparent outline-none w-full"
                                />
                            ) : (
                                <h2 className="text-xl font-bold text-gray-900">{profile?.name || 'Candidate'}</h2>
                            )}
                            <p className="text-gray-500">Candidate</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 text-gray-600">
                            <Mail size={18} />
                            {editing ? (
                                <input
                                    type="email"
                                    value={editedProfile?.email || ''}
                                    onChange={(e) => updateEditedField('email', e.target.value)}
                                    className="text-sm border-b border-gray-300 bg-transparent outline-none flex-1"
                                />
                            ) : (
                                <span className="text-sm">{profile?.email || '-'}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <Phone size={18} />
                            {editing ? (
                                <input
                                    type="tel"
                                    value={editedProfile?.phone || ''}
                                    onChange={(e) => updateEditedField('phone', e.target.value)}
                                    className="text-sm border-b border-gray-300 bg-transparent outline-none flex-1"
                                />
                            ) : (
                                <span className="text-sm">{profile?.phone || 'No phone added'}</span>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-gray-600">
                            <Calendar size={18} />
                            <span className="text-sm">
                                {profile?.dateOfBirth
                                    ? new Date(profile.dateOfBirth).toLocaleDateString()
                                    : 'DOB not set'}
                            </span>
                        </div>
                        {profile?.institution && (
                            <div className="flex items-center gap-3 text-gray-600">
                                <School size={18} />
                                <span className="text-sm">{profile.institution}</span>
                            </div>
                        )}
                        {profile?.boardOfStudy && (
                            <div className="flex items-center gap-3 text-gray-600">
                                <BookOpen size={18} />
                                <span className="text-sm">Board: {profile.boardOfStudy}</span>
                            </div>
                        )}
                        {profile?.parentName && (
                            <div className="flex items-center gap-3 text-gray-600">
                                <User size={18} />
                                <span className="text-sm">Parent: {profile.parentName}</span>
                            </div>
                        )}
                        {profile?.parentOccupation && (
                            <div className="flex items-center gap-3 text-gray-600">
                                <Briefcase size={18} />
                                <span className="text-sm">{profile.parentOccupation}</span>
                            </div>
                        )}
                    </div>

                    {profile?.fullAddress && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                            <div className="flex items-start gap-3 text-gray-600">
                                <MapPin size={18} className="mt-0.5" />
                                <span className="text-sm">{profile.fullAddress}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Login Location Card */}
                {loginLocation && (
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl shadow-sm p-6 mb-6 border border-green-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <MapPin size={20} className="text-green-600" />
                            Current Login Location
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="text-sm text-gray-600">
                                <span className="font-medium">Coordinates:</span> {loginLocation.latitude.toFixed(6)}, {loginLocation.longitude.toFixed(6)}
                            </div>
                            {loginLocation.address && (
                                <div className="text-sm text-gray-600">
                                    <span className="font-medium">Address:</span> {loginLocation.address}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Location from Profile */}
                {profile?.location && (
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <MapPin size={20} className="text-blue-600" />
                            Profile Location
                        </h3>
                        <div className="text-sm text-gray-600">
                            {profile.location.address && <p className="mb-2">{profile.location.address}</p>}
                            <p className="text-xs text-gray-400">
                                Lat: {profile.location.latitude.toFixed(6)}, Lng: {profile.location.longitude.toFixed(6)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Academic Info */}
                {(profile?.tenthGrade || profile?.eleventhGrade) && (
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <BookOpen size={20} className="text-blue-600" />
                            Academic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {profile?.tenthGrade && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium text-gray-700 mb-3">10th Grade Marks</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                        <p>Mathematics: <span className="font-semibold">{profile.tenthGrade.mathematics || '-'}</span></p>
                                        <p>Physics: <span className="font-semibold">{profile.tenthGrade.physics || '-'}</span></p>
                                        <p>Chemistry: <span className="font-semibold">{profile.tenthGrade.chemistry || '-'}</span></p>
                                        <p>Biology: <span className="font-semibold">{profile.tenthGrade.biology || '-'}</span></p>
                                    </div>
                                </div>
                            )}
                            {profile?.eleventhGrade && (
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-medium text-gray-700 mb-3">11th Grade Marks</h4>
                                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                                        <p>Mathematics: <span className="font-semibold">{profile.eleventhGrade.mathematics || '-'}</span></p>
                                        <p>Physics: <span className="font-semibold">{profile.eleventhGrade.physics || '-'}</span></p>
                                        <p>Chemistry: <span className="font-semibold">{profile.eleventhGrade.chemistry || '-'}</span></p>
                                        <p>Biology: <span className="font-semibold">{profile.eleventhGrade.biology || '-'}</span></p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Extracurricular */}
                {profile?.extracurricular && (
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Activity size={20} className="text-purple-600" />
                            Extracurricular Activities
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                            {profile.extracurricular.sports && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <span className="font-medium text-gray-700 block mb-1">Sports</span>
                                    <p className="text-gray-600">{profile.extracurricular.sports}</p>
                                </div>
                            )}
                            {profile.extracurricular.leadership && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <span className="font-medium text-gray-700 block mb-1">Leadership</span>
                                    <p className="text-gray-600">{profile.extracurricular.leadership}</p>
                                </div>
                            )}
                            {profile.extracurricular.cultural && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <span className="font-medium text-gray-700 block mb-1">Cultural</span>
                                    <p className="text-gray-600">{profile.extracurricular.cultural}</p>
                                </div>
                            )}
                            {profile.extracurricular.academic && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <span className="font-medium text-gray-700 block mb-1">Academic</span>
                                    <p className="text-gray-600">{profile.extracurricular.academic}</p>
                                </div>
                            )}
                            {profile.extracurricular.technology && (
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <span className="font-medium text-gray-700 block mb-1">Technology</span>
                                    <p className="text-gray-600">{profile.extracurricular.technology}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Interests */}
                {profile?.interests && getSelectedInterests().length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Award size={20} className="text-yellow-600" />
                            Fields of Interest
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {getSelectedInterests().map((interest, idx) => (
                                <span
                                    key={idx}
                                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                                >
                                    {interest}
                                </span>
                            ))}
                            {profile.interests.other && (
                                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                                    {profile.interests.other}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Test History */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Clock size={20} className="text-gray-600" />
                            Test History
                        </h3>
                    </div>
                    {assignments.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No tests assigned yet.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Test</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {assignments.map((assignment) => (
                                        <tr key={assignment.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{assignment.title}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs capitalize">
                                                    {assignment.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs capitalize ${assignment.status === 'submitted'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {assignment.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(assignment.submitted_at || assignment.assigned_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {assignment.status === 'submitted' && assignment.response_id && (
                                                    <button
                                                        onClick={() => handleDownloadReport(assignment.response_id!, assignment.title)}
                                                        className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                                                    >
                                                        <Download size={14} />
                                                        Report
                                                    </button>
                                                )}
                                                {assignment.status !== 'submitted' && (
                                                    <button
                                                        onClick={() => navigate(`/test/${assignment.id}`)}
                                                        className="px-3 py-1 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded"
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

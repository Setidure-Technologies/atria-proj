import { useState, useEffect } from 'react';
import { StudentInfo } from './StudentInfo';
import Dashboard from '../Dashboard';
import { apiDB } from '../lib/apiDatabase';

export default function CandidateGate() {
    const [loading, setLoading] = useState(true);
    const [needsProfile, setNeedsProfile] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);

    useEffect(() => {
        const checkProfile = async () => {
            try {
                const res = await apiDB.getProfile();
                if (res.exists && res.is_completed) {
                    setNeedsProfile(false);
                } else {
                    setNeedsProfile(true);
                    if (res.exists) {
                        setProfileData(res.profile);
                    }
                }
            } catch (error) {
                // If 404 or error, assume profile needed
                setNeedsProfile(true);
            } finally {
                setLoading(false);
            }
        };
        checkProfile();
    }, []);

    const handleStart = async (name: string, email: string, studentData: any) => {
        try {
            await apiDB.saveProfile({ ...studentData, name, email });
            setNeedsProfile(false);
        } catch (error) {
            console.error('Failed to save profile:', error);
            alert('Failed to save profile. Please try again.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (needsProfile) {
        return <StudentInfo onStart={handleStart} initialData={profileData} />;
    }

    return <Dashboard />;
}

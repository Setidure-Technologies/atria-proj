import React, { useState, useEffect, useRef, FormEvent } from 'react';
import {
  User, Mail, Phone, MapPin, BookOpen, Award, GraduationCap,
  Home, Calendar, School, Briefcase, DollarSign, Activity
} from 'lucide-react';

// Types
interface StudentData {
  // Personal Information
  name: string;
  email: string;
  phone: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };

  // University Application Data (new fields)
  institution: string;
  boardOfStudy: string;
  dateOfBirth: string;
  parentName: string;
  parentOccupation: string;
  annualIncome: string;
  fullAddress: string;

  // Academic Information
  tenthGrade: {
    mathematics: string;
    physics: string;
    chemistry: string;
    biology: string;
  };

  eleventhGrade: {
    mathematics: string;
    physics: string;
    chemistry: string;
    biology: string;
  };

  // Extracurricular Activities
  extracurricular: {
    sports: string;
    leadership: string;
    cultural: string;
    academic: string;
    technology: string;
  };

  // Fields of Interest
  interests: {
    aiMlDataScience: boolean;
    energySustainability: boolean;
    emobilityIot: boolean;
    lifeSciencesHealthcare: boolean;
    businessEntrepreneurship: boolean;
    other?: string;
  };

  // Declaration
  signature: string;
  termsAccepted: boolean;
}

interface AppState {
  step: 'info' | 'academic' | 'extracurricular' | 'interests' | 'review' | 'otp' | 'location';

  // Basic Info
  name: string;
  email: string;
  phone: string;

  // University Info
  institution: string;
  boardOfStudy: string;
  dateOfBirth: string;
  parentName: string;
  parentOccupation: string;
  annualIncome: string;
  fullAddress: string;

  // Academic
  tenthGrade: {
    mathematics: string;
    physics: string;
    chemistry: string;
    biology: string;
  };
  eleventhGrade: {
    mathematics: string;
    physics: string;
    chemistry: string;
    biology: string;
  };

  // Extracurricular
  extracurricular: {
    sports: string;
    leadership: string;
    cultural: string;
    academic: string;
    technology: string;
  };

  // Interests
  interests: {
    aiMlDataScience: boolean;
    energySustainability: boolean;
    emobilityIot: boolean;
    lifeSciencesHealthcare: boolean;
    businessEntrepreneurship: boolean;
    other: string;
  };

  // Declaration
  signature: string;
  termsAccepted: boolean;

  // OTP & Location
  otp: string;
  generatedOtp: string;
  otpVerified: boolean;
  location: { latitude: number; longitude: number; address?: string } | null;
  isLoadingLocation: boolean;
  isLoadingOtp: boolean;
  countdown: number;
}

interface StudentInfoProps {
  onStart: (name: string, email: string, studentData?: StudentData) => void;
  initialData?: any;
}

// Utility functions (keep existing ones)
const formatCountdown = (countdown: number): string => {
  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};



const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

const getAddressFromCoordinates = async (
  latitude: number,
  longitude: number
): Promise<string> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
    );
    const data = await response.json();
    return data.display_name || 'Location captured';
  } catch (error) {
    console.error('Geocoding error:', error);
    return 'Location captured';
  }
};

// Main Component
export function StudentInfo({ onStart, initialData }: StudentInfoProps) {
  // State management
  const [state, setState] = useState<AppState>({
    step: 'info',

    // Basic Info
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',

    // University Info
    institution: initialData?.institution || '',
    boardOfStudy: initialData?.boardOfStudy || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    parentName: initialData?.parentName || '',
    parentOccupation: initialData?.parentOccupation || '',
    annualIncome: initialData?.annualIncome || '',
    fullAddress: initialData?.fullAddress || '',

    // Academic
    tenthGrade: initialData?.tenthGrade || {
      mathematics: '',
      physics: '',
      chemistry: '',
      biology: ''
    },
    eleventhGrade: initialData?.eleventhGrade || {
      mathematics: '',
      physics: '',
      chemistry: '',
      biology: ''
    },

    // Extracurricular
    extracurricular: initialData?.extracurricular || {
      sports: '',
      leadership: '',
      cultural: '',
      academic: '',
      technology: ''
    },

    // Interests
    interests: initialData?.interests || {
      aiMlDataScience: false,
      energySustainability: false,
      emobilityIot: false,
      lifeSciencesHealthcare: false,
      businessEntrepreneurship: false,
      other: ''
    },

    // Declaration
    signature: initialData?.signature || '',
    termsAccepted: initialData?.termsAccepted || false,

    // OTP & Location
    otp: '',
    generatedOtp: '',
    otpVerified: false,
    location: initialData?.location || null,
    isLoadingLocation: false,
    isLoadingOtp: false,
    countdown: 0,
  });

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Handle countdown timer
  useEffect(() => {
    if (state.countdown <= 0) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      return;
    }

    countdownIntervalRef.current = setInterval(() => {
      setState((prev) => ({
        ...prev,
        countdown: prev.countdown - 1,
      }));
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [state.countdown]);



  // Location handling
  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setState((prev) => ({ ...prev, isLoadingLocation: true }));

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      const { latitude, longitude } = position.coords;
      const address = await getAddressFromCoordinates(latitude, longitude);

      setState((prev) => ({
        ...prev,
        location: { latitude, longitude, address },
        isLoadingLocation: false,
      }));
    } catch (error) {
      console.error('Error getting location:', error);
      alert('Unable to retrieve your location. Please enable location services.');

      setState((prev) => ({
        ...prev,
        location: { latitude: 0, longitude: 0, address: 'Location not available' },
        isLoadingLocation: false,
      }));
    }
  };

  // Navigation handlers
  const nextStep = () => {
    const steps: AppState['step'][] = ['info', 'academic', 'extracurricular', 'interests', 'review', 'location'];
    const currentIndex = steps.indexOf(state.step);
    if (currentIndex < steps.length - 1) {
      setState(prev => ({ ...prev, step: steps[currentIndex + 1] }));
    }
  };

  const prevStep = () => {
    const steps: AppState['step'][] = ['info', 'academic', 'extracurricular', 'interests', 'review', 'location'];
    const currentIndex = steps.indexOf(state.step);
    if (currentIndex > 0) {
      setState(prev => ({ ...prev, step: steps[currentIndex - 1] }));
    }
  };

  // Form handlers
  const handleInfoSubmit = (e: FormEvent) => {
    e.preventDefault();
    const { name, email, phone, institution, dateOfBirth } = state;

    if (name.trim() && email.trim() && phone.trim() && institution.trim() && dateOfBirth.trim()) {
      if (!validatePhone(phone)) {
        alert('Please enter a valid 10-digit phone number');
        return;
      }
      nextStep();
    } else {
      alert('Please fill all required fields');
    }
  };

  const handleAcademicSubmit = (e: FormEvent) => {
    e.preventDefault();
    // Validate academic fields
    const { tenthGrade, eleventhGrade } = state;
    const requiredFields = [
      tenthGrade.mathematics, tenthGrade.physics, tenthGrade.chemistry, tenthGrade.biology,
      eleventhGrade.mathematics, eleventhGrade.physics, eleventhGrade.chemistry, eleventhGrade.biology
    ];

    if (requiredFields.every(field => field.trim())) {
      nextStep();
    } else {
      alert('Please fill all academic marks fields');
    }
  };

  const handleExtracurricularSubmit = (e: FormEvent) => {
    e.preventDefault();
    nextStep();
  };

  const handleInterestsSubmit = (e: FormEvent) => {
    e.preventDefault();
    const { interests } = state;
    const selectedInterests = Object.values(interests).filter(val => typeof val === 'boolean' && val === true);

    if (selectedInterests.length > 0) {
      nextStep();
    } else {
      alert('Please select at least one field of interest');
    }
  };

  const handleReviewSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!state.termsAccepted) {
      alert('Please accept the terms and conditions');
      return;
    }

    // Skip OTP and go directly to location
    setState(prev => ({
      ...prev,
      otpVerified: true, // Auto-verify since we are skipping
      step: 'location'
    }));
    handleGetLocation();
  };



  const handleLocationSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!state.location) {
      alert('Please allow location access to continue');
      return;
    }

    const studentData: StudentData = {
      name: state.name.trim(),
      email: state.email.trim(),
      phone: state.phone.trim(),
      location: state.location,

      // University data
      institution: state.institution.trim(),
      boardOfStudy: state.boardOfStudy.trim(),
      dateOfBirth: state.dateOfBirth,
      parentName: state.parentName.trim(),
      parentOccupation: state.parentOccupation.trim(),
      annualIncome: state.annualIncome.trim(),
      fullAddress: state.fullAddress.trim(),

      // Academic data
      tenthGrade: state.tenthGrade,
      eleventhGrade: state.eleventhGrade,

      // Extracurricular data
      extracurricular: state.extracurricular,

      // Interests data
      interests: state.interests,

      // Declaration
      signature: state.signature.trim(),
      termsAccepted: state.termsAccepted
    };

    console.log('📤 Calling onStart with student data:', studentData);
    onStart(studentData.name, studentData.email, studentData);
  };

  const handleSkipLocation = () => {
    setState((prev) => ({
      ...prev,
      location: {
        latitude: 0,
        longitude: 0,
        address: 'Location not provided',
      },
    }));
  };

  // Helper function to update nested state
  const updateNestedState = <K extends keyof AppState>(
    category: K,
    key: keyof AppState[K],
    value: any
  ) => {
    setState(prev => ({
      ...prev,
      [category]: {
        ...(prev[category] as object),
        [key]: value
      }
    }));
  };

  // Step 1: Basic & Personal Information
  if (state.step === 'info') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Atria University Application</h1>
            <p className="text-gray-600">Personal Information</p>
            <div className="mt-2 text-sm text-orange-600 font-medium">
              Step 1 of 7: Personal Details
            </div>
          </div>

          <form onSubmit={handleInfoSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Student Information</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={state.name}
                      onChange={(e) => setState(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="email"
                      value={state.email}
                      onChange={(e) => setState(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="tel"
                      value={state.phone}
                      onChange={(e) => setState(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="date"
                      value={state.dateOfBirth}
                      onChange={(e) => setState(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Institution & Board */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Educational Background</h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Institution *
                  </label>
                  <div className="relative">
                    <School className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={state.institution}
                      onChange={(e) => setState(prev => ({ ...prev, institution: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                      placeholder="School/College name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Board of Study *
                  </label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <select
                      value={state.boardOfStudy}
                      onChange={(e) => setState(prev => ({ ...prev, boardOfStudy: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition appearance-none bg-white"
                      required
                    >
                      <option value="">Select Board</option>
                      <option value="State">State Board</option>
                      <option value="CBSE">CBSE</option>
                      <option value="ICSE">ICSE</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Address
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 text-gray-400" size={20} />
                    <textarea
                      value={state.fullAddress}
                      onChange={(e) => setState(prev => ({ ...prev, fullAddress: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                      placeholder="Enter your complete address"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Parent Information */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Parent/Guardian Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent/Guardian Name
                  </label>
                  <input
                    type="text"
                    value={state.parentName}
                    onChange={(e) => setState(prev => ({ ...prev, parentName: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    placeholder="Parent/Guardian name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Occupation
                  </label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={state.parentOccupation}
                      onChange={(e) => setState(prev => ({ ...prev, parentOccupation: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                      placeholder="Parent's occupation"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Annual Income
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      value={state.annualIncome}
                      onChange={(e) => setState(prev => ({ ...prev, annualIncome: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                      placeholder="Annual income"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t">
              <button
                type="button"
                disabled
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 font-medium"
              >
                Previous
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition duration-200 shadow-md hover:shadow-lg"
              >
                Next: Academic Information
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step 2: Academic Information
  if (state.step === 'academic') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Academic Information</h1>
            <p className="text-gray-600">Enter your 10th and 11th grade marks</p>
            <div className="mt-2 text-sm text-orange-600 font-medium">
              Step 2 of 7: Academic Details
            </div>
          </div>

          <form onSubmit={handleAcademicSubmit} className="space-y-8">
            {/* 10th Grade */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b">10th Grade Marks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mathematics</label>
                  <input
                    type="text"
                    value={state.tenthGrade.mathematics}
                    onChange={(e) => updateNestedState('tenthGrade', 'mathematics', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    placeholder="Marks/Percentage"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Physics</label>
                  <input
                    type="text"
                    value={state.tenthGrade.physics}
                    onChange={(e) => updateNestedState('tenthGrade', 'physics', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    placeholder="Marks/Percentage"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chemistry</label>
                  <input
                    type="text"
                    value={state.tenthGrade.chemistry}
                    onChange={(e) => updateNestedState('tenthGrade', 'chemistry', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    placeholder="Marks/Percentage"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Biology</label>
                  <input
                    type="text"
                    value={state.tenthGrade.biology}
                    onChange={(e) => updateNestedState('tenthGrade', 'biology', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    placeholder="Marks/Percentage"
                    required
                  />
                </div>
              </div>
            </div>

            {/* 11th Grade */}
            <div>
              <h3 className="text-xl font-semibold text-gray-800 mb-6 pb-2 border-b">11th Grade Marks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mathematics</label>
                  <input
                    type="text"
                    value={state.eleventhGrade.mathematics}
                    onChange={(e) => updateNestedState('eleventhGrade', 'mathematics', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    placeholder="Marks/Percentage"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Physics</label>
                  <input
                    type="text"
                    value={state.eleventhGrade.physics}
                    onChange={(e) => updateNestedState('eleventhGrade', 'physics', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    placeholder="Marks/Percentage"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Chemistry</label>
                  <input
                    type="text"
                    value={state.eleventhGrade.chemistry}
                    onChange={(e) => updateNestedState('eleventhGrade', 'chemistry', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    placeholder="Marks/Percentage"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Biology</label>
                  <input
                    type="text"
                    value={state.eleventhGrade.biology}
                    onChange={(e) => updateNestedState('eleventhGrade', 'biology', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                    placeholder="Marks/Percentage"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 font-medium hover:bg-gray-50 transition"
              >
                Previous
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition duration-200 shadow-md hover:shadow-lg"
              >
                Next: Extracurricular
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step 3: Extracurricular Activities
  if (state.step === 'extracurricular') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Extracurricular Activities</h1>
            <p className="text-gray-600">Tell us about your achievements and interests</p>
            <div className="mt-2 text-sm text-orange-600 font-medium">
              Step 3 of 7: Activities
            </div>
          </div>

          <form onSubmit={handleExtracurricularSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sports Achievements
              </label>
              <div className="relative">
                <Activity className="absolute left-3 top-3 text-gray-400" size={20} />
                <textarea
                  value={state.extracurricular.sports}
                  onChange={(e) => updateNestedState('extracurricular', 'sports', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  placeholder="List your sports achievements..."
                  rows={3}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Leadership Roles
              </label>
              <div className="relative">
                <Award className="absolute left-3 top-3 text-gray-400" size={20} />
                <textarea
                  value={state.extracurricular.leadership}
                  onChange={(e) => updateNestedState('extracurricular', 'leadership', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  placeholder="List leadership positions held..."
                  rows={3}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cultural Activities
              </label>
              <textarea
                value={state.extracurricular.cultural}
                onChange={(e) => updateNestedState('extracurricular', 'cultural', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                placeholder="Music, Dance, Art, etc..."
                rows={3}
              />
            </div>

            <div className="flex justify-between pt-6 border-t">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 font-medium hover:bg-gray-50 transition"
              >
                Previous
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition duration-200 shadow-md hover:shadow-lg"
              >
                Next: Fields of Interest
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step 4: Fields of Interest
  if (state.step === 'interests') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Fields of Interest</h1>
            <p className="text-gray-600">Select the areas you are passionate about</p>
            <div className="mt-2 text-sm text-orange-600 font-medium">
              Step 4 of 7: Interests
            </div>
          </div>

          <form onSubmit={handleInterestsSubmit} className="space-y-6">
            <div className="space-y-4">
              {[
                { key: 'aiMlDataScience', label: 'AI, ML & Data Science' },
                { key: 'energySustainability', label: 'Energy & Sustainability' },
                { key: 'emobilityIot', label: 'E-Mobility & IoT' },
                { key: 'lifeSciencesHealthcare', label: 'Life Sciences & Healthcare' },
                { key: 'businessEntrepreneurship', label: 'Business & Entrepreneurship' }
              ].map((interest) => (
                <label key={interest.key} className="flex items-center p-4 border rounded-lg hover:bg-orange-50 cursor-pointer transition">
                  <input
                    type="checkbox"
                    checked={state.interests[interest.key as keyof typeof state.interests] as boolean}
                    onChange={(e) => updateNestedState('interests', interest.key as keyof typeof state.interests, e.target.checked)}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <span className="ml-3 text-gray-700 font-medium">{interest.label}</span>
                </label>
              ))}

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Other Interests</label>
                <input
                  type="text"
                  value={state.interests.other}
                  onChange={(e) => updateNestedState('interests', 'other', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  placeholder="Specify any other interests..."
                />
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 font-medium hover:bg-gray-50 transition"
              >
                Previous
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition duration-200 shadow-md hover:shadow-lg"
              >
                Next: Review
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Step 5: Review & Declaration
  if (state.step === 'review') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Application</h1>
            <p className="text-gray-600">Please review your details before submission</p>
            <div className="mt-2 text-sm text-orange-600 font-medium">
              Step 5 of 7: Review
            </div>
          </div>

          <form onSubmit={handleReviewSubmit} className="space-y-8">
            <div className="bg-gray-50 p-6 rounded-xl space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-gray-500 block">Name</span>
                  <span className="font-medium">{state.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Email</span>
                  <span className="font-medium">{state.email}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Phone</span>
                  <span className="font-medium">{state.phone}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Institution</span>
                  <span className="font-medium">{state.institution}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t pt-6">
              <h3 className="font-semibold text-gray-800">Declaration</h3>
              <div className="flex items-start">
                <input
                  type="checkbox"
                  checked={state.termsAccepted}
                  onChange={(e) => setState(prev => ({ ...prev, termsAccepted: e.target.checked }))}
                  className="mt-1 w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  required
                />
                <p className="ml-3 text-sm text-gray-600">
                  I hereby declare that the information provided above is true and correct to the best of my knowledge.
                  I understand that any misrepresentation may lead to rejection of my application.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Digital Signature (Type Full Name)</label>
                <input
                  type="text"
                  value={state.signature}
                  onChange={(e) => setState(prev => ({ ...prev, signature: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  placeholder="Type your full name as signature"
                  required
                />
              </div>
            </div>

            <div className="flex justify-between pt-6 border-t">
              <button
                type="button"
                onClick={prevStep}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 font-medium hover:bg-gray-50 transition"
              >
                Previous
              </button>
              <button
                type="submit"
                disabled={!state.termsAccepted || !state.signature}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Proceed to Location
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }



  // Step 7: Location Permission
  if (state.step === 'location') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <MapPin className="text-orange-600" size={40} />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-4">Location Access</h2>
          <p className="text-gray-600 mb-8">
            To complete your application, we need to capture your current location for verification purposes.
          </p>

          {state.isLoadingLocation ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-600"></div>
              <p className="text-sm text-gray-500">Getting your location...</p>
            </div>
          ) : (
            <div className="space-y-4">
              <button
                onClick={handleLocationSubmit}
                className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl transition duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                <MapPin size={20} />
                Allow Location & Submit
              </button>

              <button
                onClick={handleSkipLocation}
                className="text-gray-500 text-sm hover:text-gray-700 underline"
              >
                Skip for now (Development only)
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
import React, { useState, useEffect, FormEvent } from 'react';
import {
  User,
  MapPin,
  Activity,
  ChevronRight,
  Briefcase,
  IndianRupee,
  Phone
} from 'lucide-react';

interface StudentInfoProps {
  onStart: (name: string, email: string, studentData: any) => void;
  initialData?: any;
}

// Steps: Personal -> Academic -> Extracurricular -> Location
type Step = 'personal' | 'academic' | 'extracurricular' | 'location';

export function StudentInfo({ onStart, initialData }: StudentInfoProps) {
  const [step, setStep] = useState<Step>('personal');
  const [loading, setLoading] = useState(false);

  // State
  const [state, setState] = useState({
    // Personal
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    dateOfBirth: '',
    gender: '',
    institution: '',
    board: '',
    address: '',

    // Parent
    parentName: '',
    parentRelation: '',
    parentPhone: '',
    parentOccupation: '',
    annualIncome: '',

    // Academic - 10th
    tenthMarkingSystem: 'percentage' as 'percentage' | 'cgpa',
    tenthGrade: {
      mathematics: '',
      physics: '',
      chemistry: '',
      biology: '',
      final: '' // Final CGPA or Percentage
    },

    // Academic - 11th (Optional)
    eleventhMarkingSystem: 'percentage' as 'percentage' | 'cgpa',
    eleventhGrade: {
      mathematics: '',
      physics: '',
      chemistry: '',
      biology: '',
      final: ''
    },

    // Academic - 12th (Optional)
    twelfthGrade: {
      final: ''
    },

    // Extracurricular
    activities: [] as string[],
    otherActivity: '',
    achievements: '',

    // Location
    location: null as { lat: number; lng: number; address?: string } | null,
    locationError: null as string | null,
  });

  useEffect(() => {
    if (initialData) {
      setState(prev => ({
        ...prev,
        name: initialData.name || prev.name,
        email: initialData.email || prev.email,
        phone: initialData.phone || prev.phone,
        ...initialData
      }));
    }
  }, [initialData]);

  const updateNestedState = (parent: 'tenthGrade' | 'eleventhGrade' | 'twelfthGrade', field: string, value: string) => {
    // Validate numeric input
    if (value && !/^\d*\.?\d*$/.test(value)) return;

    setState(prev => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value }
    }));
  };

  const validateMarks = (value: string, system: 'percentage' | 'cgpa') => {
    if (!value) return true; // Allow empty for optional fields
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    if (system === 'percentage') return num >= 0 && num <= 100;
    if (system === 'cgpa') return num >= 0 && num <= 10;
    return false;
  };

  const handlePersonalSubmit = (e: FormEvent) => {
    e.preventDefault();
    const { name, dateOfBirth, gender, institution, board, parentName, parentRelation, parentPhone } = state;

    if (!name || !dateOfBirth || !gender || !institution || !board) {
      alert('Please fill all required personal fields');
      return;
    }

    if (!parentName || !parentRelation || !parentPhone) {
      alert('Please fill all required parent/guardian fields');
      return;
    }

    if (parentPhone.length !== 10) {
      alert('Please enter a valid 10-digit parent phone number');
      return;
    }

    setStep('academic');
  };

  const handleAcademicSubmit = (e: FormEvent) => {
    e.preventDefault();
    const { tenthGrade, tenthMarkingSystem, eleventhGrade, eleventhMarkingSystem, twelfthGrade } = state;

    // Validate 10th Grade (Mandatory)
    const tenthFields = [tenthGrade.mathematics, tenthGrade.physics, tenthGrade.chemistry, tenthGrade.biology, tenthGrade.final];
    if (tenthFields.some(f => !f)) {
      alert('Please fill all 10th grade fields');
      return;
    }

    // Validate 10th values
    if (!validateMarks(tenthGrade.final, tenthMarkingSystem)) {
      alert(`Invalid 10th Grade ${tenthMarkingSystem === 'percentage' ? 'Percentage (0-100)' : 'CGPA (0-10)'}`);
      return;
    }

    // Validate 11th Grade (Optional but if filled, must be valid)
    const eleventhFields = [eleventhGrade.mathematics, eleventhGrade.physics, eleventhGrade.chemistry, eleventhGrade.biology, eleventhGrade.final];
    const isEleventhPartiallyFilled = eleventhFields.some(f => !!f);

    if (isEleventhPartiallyFilled) {
      if (eleventhFields.some(f => !f)) {
        alert('Please complete all 11th grade fields if you wish to include them');
        return;
      }
      if (!validateMarks(eleventhGrade.final, eleventhMarkingSystem)) {
        alert(`Invalid 11th Grade ${eleventhMarkingSystem === 'percentage' ? 'Percentage (0-100)' : 'CGPA (0-10)'}`);
        return;
      }
    }

    // Validate 12th Grade (Optional)
    if (twelfthGrade.final && !validateMarks(twelfthGrade.final, 'cgpa')) { // Assuming 12th is usually CGPA/Percentage, let's be lenient or add toggle if needed. For now, check generic range 0-100
      const num = parseFloat(twelfthGrade.final);
      if (num < 0 || num > 100) {
        alert('Invalid 12th Grade Final Score');
        return;
      }
    }

    setStep('extracurricular');
  };

  const handleExtracurricularSubmit = (e: FormEvent) => {
    e.preventDefault();
    setStep('location');
  };

  const handleLocationSubmit = async () => {
    if (!state.location) {
      // Try to get location one last time or just proceed
    }
    await submitForm();
  };

  const submitForm = async () => {
    setLoading(true);
    // Prepare data
    const studentData = {
      ...state,
      // Ensure numeric values are stored as numbers if needed, or keep as strings
    };

    onStart(state.name, state.email, studentData);
    setLoading(false);
  };

  const getLocation = () => {
    if (!navigator.geolocation) {
      setState(prev => ({ ...prev, locationError: 'Geolocation is not supported by your browser' }));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setState(prev => ({
          ...prev,
          location: { lat: latitude, lng: longitude },
          locationError: null
        }));

        // Optional: Reverse geocoding
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
          const data = await res.json();
          setState(prev => ({
            ...prev,
            location: { lat: latitude, lng: longitude, address: data.display_name }
          }));
        } catch (e) {
          // Ignore reverse geocoding error
        }
      },
      () => {
        setState(prev => ({ ...prev, locationError: 'Unable to retrieve your location' }));
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative">
      {/* Watermark Overlay */}
      <div
        className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.03]"
        style={{
          backgroundImage: 'url(/candidate/atria-logo.jpg)',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundSize: '50% auto'
        }}
      />

      <div className="relative z-10 bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="bg-orange-50 p-6 border-b border-orange-100">
          <div className="flex justify-between items-center mb-6">
            <img src="/candidate/atria-logo.jpg" alt="Atria University" className="h-12 w-auto" />
            <div className="text-sm text-gray-500">Application ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
          </div>

          {/* Progress Bar */}
          <div className="flex justify-between items-center max-w-2xl mx-auto relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 transform -translate-y-1/2"></div>

            {(['personal', 'academic', 'extracurricular', 'location'] as Step[]).map((s, i) => {
              const isActive = step === s;
              const isCompleted = ['personal', 'academic', 'extracurricular', 'location'].indexOf(step) > i;

              return (
                <div key={s} className={`flex flex-col items-center ${isActive ? 'text-orange-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center bg-white border-2 ${isActive ? 'border-orange-600 text-orange-600' :
                      isCompleted ? 'border-green-600 text-green-600' : 'border-gray-300'
                    } transition-all duration-300`}>
                    {isCompleted ? '✓' : i + 1}
                  </div>
                  <span className="text-xs font-medium mt-2 capitalize">{s}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {step === 'personal' && (
            <form onSubmit={handlePersonalSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Personal Details */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <User className="w-5 h-5 mr-2 text-orange-600" />
                    Personal Details
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={state.name}
                      onChange={e => setState(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input
                        type="date"
                        value={state.dateOfBirth}
                        onChange={e => setState(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        value={state.gender}
                        onChange={e => setState(prev => ({ ...prev, gender: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        required
                      >
                        <option value="">Select</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Institution</label>
                    <input
                      type="text"
                      value={state.institution}
                      onChange={e => setState(prev => ({ ...prev, institution: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                      placeholder="School/College Name"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Board of Study</label>
                    <select
                      value={state.board}
                      onChange={e => setState(prev => ({ ...prev, board: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                      required
                    >
                      <option value="">Select Board</option>
                      <option value="CBSE">CBSE</option>
                      <option value="ICSE">ICSE</option>
                      <option value="State Board">State Board</option>
                      <option value="IB">IB</option>
                      <option value="IGCSE">IGCSE</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea
                      value={state.address}
                      onChange={e => setState(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                      rows={3}
                    />
                  </div>
                </div>

                {/* Parent Details */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <User className="w-5 h-5 mr-2 text-orange-600" />
                    Parent/Guardian Details
                  </h3>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Name</label>
                    <input
                      type="text"
                      value={state.parentName}
                      onChange={e => setState(prev => ({ ...prev, parentName: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                    <select
                      value={state.parentRelation}
                      onChange={e => setState(prev => ({ ...prev, parentRelation: e.target.value }))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                      required
                    >
                      <option value="">Select</option>
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parent Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="tel"
                        value={state.parentPhone}
                        onChange={e => setState(prev => ({ ...prev, parentPhone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                        placeholder="10-digit number"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={state.parentOccupation}
                        onChange={e => setState(prev => ({ ...prev, parentOccupation: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        value={state.annualIncome}
                        onChange={e => setState(prev => ({ ...prev, annualIncome: e.target.value }))}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6 border-t">
                <button
                  type="submit"
                  className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center font-medium"
                >
                  Next: Academic Details
                  <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </form>
          )}

          {step === 'academic' && (
            <form onSubmit={handleAcademicSubmit} className="space-y-8">
              {/* 10th Grade */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">10th Grade Marks</h3>
                  <div className="flex bg-white rounded-lg p-1 border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setState(prev => ({ ...prev, tenthMarkingSystem: 'percentage' }))}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${state.tenthMarkingSystem === 'percentage' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      Percentage
                    </button>
                    <button
                      type="button"
                      onClick={() => setState(prev => ({ ...prev, tenthMarkingSystem: 'cgpa' }))}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${state.tenthMarkingSystem === 'cgpa' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      CGPA
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {['Mathematics', 'Physics', 'Chemistry', 'Biology'].map(subject => (
                    <div key={subject}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{subject}</label>
                      <input
                        type="text"
                        value={(state.tenthGrade as any)[subject.toLowerCase()]}
                        onChange={e => updateNestedState('tenthGrade', subject.toLowerCase(), e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                        placeholder="Marks"
                        required
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 font-bold text-orange-700">
                      Final {state.tenthMarkingSystem === 'cgpa' ? 'CGPA' : '%'}
                    </label>
                    <input
                      type="text"
                      value={state.tenthGrade.final}
                      onChange={e => updateNestedState('tenthGrade', 'final', e.target.value)}
                      className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-orange-50"
                      placeholder={state.tenthMarkingSystem === 'cgpa' ? 'e.g. 9.5' : 'e.g. 85.5'}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* 11th Grade */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-gray-800">11th Grade Marks</h3>
                    <span className="ml-3 px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">Optional</span>
                  </div>
                  <div className="flex bg-white rounded-lg p-1 border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setState(prev => ({ ...prev, eleventhMarkingSystem: 'percentage' }))}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${state.eleventhMarkingSystem === 'percentage' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      Percentage
                    </button>
                    <button
                      type="button"
                      onClick={() => setState(prev => ({ ...prev, eleventhMarkingSystem: 'cgpa' }))}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${state.eleventhMarkingSystem === 'cgpa' ? 'bg-orange-100 text-orange-700' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                    >
                      CGPA
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {['Mathematics', 'Physics', 'Chemistry', 'Biology'].map(subject => (
                    <div key={subject}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{subject}</label>
                      <input
                        type="text"
                        value={(state.eleventhGrade as any)[subject.toLowerCase()]}
                        onChange={e => updateNestedState('eleventhGrade', subject.toLowerCase(), e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                        placeholder="Marks"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1 font-bold text-orange-700">
                      Final {state.eleventhMarkingSystem === 'cgpa' ? 'CGPA' : '%'}
                    </label>
                    <input
                      type="text"
                      value={state.eleventhGrade.final}
                      onChange={e => updateNestedState('eleventhGrade', 'final', e.target.value)}
                      className="w-full px-3 py-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none text-sm bg-orange-50"
                      placeholder={state.eleventhMarkingSystem === 'cgpa' ? 'e.g. 9.5' : 'e.g. 85.5'}
                    />
                  </div>
                </div>
              </div>

              {/* 12th Grade */}
              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center">
                    <h3 className="text-lg font-semibold text-gray-800">12th Grade</h3>
                    <span className="ml-3 px-2 py-0.5 bg-gray-200 text-gray-600 text-xs rounded-full">If Completed</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Final Percentage / CGPA</label>
                  <input
                    type="text"
                    value={state.twelfthGrade.final}
                    onChange={e => updateNestedState('twelfthGrade', 'final', e.target.value)}
                    className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Enter final score"
                  />
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setStep('personal')}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center font-medium"
                >
                  Next: Extracurricular
                  <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </form>
          )}

          {step === 'extracurricular' && (
            <form onSubmit={handleExtracurricularSubmit} className="space-y-8">
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-orange-600" />
                  Extracurricular Activities
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {['Sports', 'Music', 'Dance', 'Art', 'Debate', 'Coding', 'Robotics', 'Social Service'].map(activity => (
                    <label key={activity} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${state.activities.includes(activity) ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-300'
                      }`}>
                      <input
                        type="checkbox"
                        checked={state.activities.includes(activity)}
                        onChange={e => {
                          if (e.target.checked) {
                            setState(prev => ({ ...prev, activities: [...prev.activities, activity] }));
                          } else {
                            setState(prev => ({ ...prev, activities: prev.activities.filter(a => a !== activity) }));
                          }
                        }}
                        className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                      />
                      <span className="ml-3 font-medium text-gray-700">{activity}</span>
                    </label>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Other Activities</label>
                  <input
                    type="text"
                    value={state.otherActivity}
                    onChange={e => setState(prev => ({ ...prev, otherActivity: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    placeholder="Any other activities?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Key Achievements / Awards</label>
                  <textarea
                    value={state.achievements}
                    onChange={e => setState(prev => ({ ...prev, achievements: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
                    rows={4}
                    placeholder="List your major achievements..."
                  />
                </div>
              </div>

              <div className="flex justify-between pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setStep('academic')}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 font-medium hover:bg-gray-50 transition-colors"
                >
                  Previous
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center font-medium"
                >
                  Next: Location
                  <ChevronRight className="w-5 h-5 ml-2" />
                </button>
              </div>
            </form>
          )}

          {step === 'location' && (
            <div className="text-center py-12 space-y-8">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                <MapPin className="w-10 h-10 text-orange-600" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Location Access</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  To complete your application, we need to capture your current location for verification purposes.
                </p>
              </div>

              {state.locationError && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg max-w-md mx-auto text-sm">
                  {state.locationError}
                </div>
              )}

              {state.location && (
                <div className="bg-green-50 text-green-700 p-4 rounded-lg max-w-md mx-auto text-sm flex items-center justify-center">
                  <span className="mr-2">✓</span> Location captured successfully
                </div>
              )}

              <div className="space-y-4">
                <button
                  onClick={getLocation}
                  className="w-full max-w-md px-8 py-4 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all shadow-lg hover:shadow-xl font-bold text-lg flex items-center justify-center mx-auto"
                >
                  <MapPin className="w-5 h-5 mr-2" />
                  {state.location ? 'Update Location' : 'Allow Location & Submit'}
                </button>

                {state.location && (
                  <button
                    onClick={handleLocationSubmit}
                    disabled={loading}
                    className="w-full max-w-md px-8 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl font-bold text-lg flex items-center justify-center mx-auto"
                  >
                    {loading ? 'Submitting...' : 'Submit Application'}
                  </button>
                )}

                <button
                  onClick={handleLocationSubmit}
                  className="block w-full text-gray-500 hover:text-gray-700 text-sm underline"
                >
                  Skip
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
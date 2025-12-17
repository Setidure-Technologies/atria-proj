import { useState, useEffect } from 'react';
import { Routes, Route, useParams, useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import TestRunner from './TestRunner';
import AdaptiveTestRunner from './AdaptiveTestRunner';
import Login from './Login';
import Dashboard from './Dashboard';
import CandidateGate from './components/CandidateGate';
import { apiDB } from './lib/apiDatabase';

import BeyondersTestRunner from './BeyondersTestRunner';

// ... existing imports

function TestDispatcher() {
  const { assignmentId } = useParams();
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get('token');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testType, setTestType] = useState<string | null>(null);
  const [testConfig, setTestConfig] = useState<any>(null);
  const [studentInfo, setStudentInfo] = useState<{ name: string, email: string } | null>(null);
  const [activeToken, setActiveToken] = useState<string | null>(null);

  useEffect(() => {
    const checkAccess = async () => {
      let token = urlToken;

      // If no URL token, check for login token
      if (!token) {
        const storedToken = localStorage.getItem('candidate_token');
        if (storedToken) {
          token = storedToken;
        } else {
          // No access method found
          navigate('/login');
          return;
        }
      }

      setActiveToken(token);

      if (assignmentId && token) {
        try {
          const result = await apiDB.validateTestToken(assignmentId, token);
          if (result.success && result.assignment) {
            // Store the full assignment data including testSlug and runner
            setTestType(result.assignment.testSlug || result.assignment.engineType || result.assignment.testType);
            setTestConfig(result.assignment.config || {});

            if (result.user) {
              setStudentInfo({
                name: result.user.name,
                email: result.user.email
              });
            }
          } else {
            setError(result.error || 'Invalid test link');
          }
        } catch (err) {
          setError('Failed to verify test link');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkAccess();
  }, [assignmentId, urlToken, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Access Error</h2>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!assignmentId || !activeToken) {
    return <Navigate to="/dashboard" />;
  }

  // Don't render test components until we have the test type
  if (!testType && loading === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md text-center">
          <div className="text-yellow-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Unable to Load Test</h2>
          <p className="text-gray-600">Test type information is missing.</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const slug = String(testType || '').trim();

  console.log('🔍 Test Dispatcher - Routing Decision:', { slug, testConfig });

  // Explicit slug-based routing (no silent fallbacks)
  if (slug === 'beyonders_science' || slug === 'beyonders_non_science') {
    console.log('✅ Routing to BeyondersTestRunner:', slug);
    return (
      <BeyondersTestRunner
        assignmentId={assignmentId}
        token={activeToken}
        testType={slug as any}
      />
    );
  }

  if (slug === 'strength360' || slug === 'psychometric') {
    console.log('✅ Routing to Strength TestRunner');
    return <TestRunner assignmentId={assignmentId} token={activeToken} />;
  }

  if (slug === 'adaptive') {
    console.log('✅ Routing to AdaptiveTestRunner');
    return (
      <AdaptiveTestRunner
        assignmentId={assignmentId}
        token={activeToken}
        testConfig={testConfig}
        studentName={studentInfo?.name}
        studentEmail={studentInfo?.email}
      />
    );
  }

  // Unknown test type - show error instead of silent fallback
  console.error('❌ Unknown test slug:', slug);
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md">
        <div className="text-red-500 text-5xl mb-4">🚫</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Unknown Test Type</h2>
        <p className="text-gray-600 mb-4">
          This test type "<span className="font-mono text-sm">{slug}</span>" is not recognized by the system.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Please contact your administrator for assistance.
        </p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}

function PrivateRoute({ children }: { children: JSX.Element }) {
  const token = localStorage.getItem('candidate_token');
  return token ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <CandidateGate />
          </PrivateRoute>
        }
      />
      <Route path="/test/:assignmentId" element={<TestDispatcher />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;

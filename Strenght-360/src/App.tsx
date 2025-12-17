import { useState, useEffect } from 'react';
import { Routes, Route, useParams, useSearchParams, useNavigate, Navigate } from 'react-router-dom';
import TestRunner from './TestRunner';
import AdaptiveTestRunner from './AdaptiveTestRunner';
import Login from './Login';
import Dashboard from './Dashboard';
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
            setTestType(result.assignment.testType);
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

  const type = String(testType || '').trim();

  if (type === 'adaptive') {
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

  if (type.includes('beyonders_science') || type.includes('beyonders_non_science')) {
    return (
      <BeyondersTestRunner
        assignmentId={assignmentId}
        token={activeToken}
        testType={type as any}
      />
    );
  }

  // Default to Psychometric TestRunner
  return <TestRunner assignmentId={assignmentId} token={activeToken} />;
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
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route path="/test/:assignmentId" element={<TestDispatcher />} />
      <Route path="/" element={<Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;

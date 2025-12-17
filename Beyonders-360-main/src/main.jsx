import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AdminApp from './AdminApp.tsx'
import { BeyondersTestComponent } from './components/BeyondersTestComponent.tsx'
import { TestCompletion } from './components/TestCompletion.tsx'
import './index.css'

function App() {
  const isTestRoute = window.location.pathname.startsWith('/test/');
  const isCompletionRoute = window.location.pathname === '/test-completed';

  if (isTestRoute || isCompletionRoute) {
    return (
      <Router>
        <Routes>
          <Route path="/test/:assignmentId" element={<BeyondersTestComponent />} />
          <Route path="/test-completed" element={<TestCompletion />} />
        </Routes>
      </Router>
    );
  }

  // Default to admin interface
  return <AdminApp />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AdminApp from './AdminApp.tsx'
import { BeyondersTestComponent } from './components/BeyondersTestComponent.tsx'
import { TestCompletion } from './components/TestCompletion.tsx'
import './index.css'

function App() {
  const pathname = window.location.pathname;
  const isTestRoute = pathname.startsWith('/admin/test/') || pathname.startsWith('/test/');
  const isCompletionRoute = pathname === '/admin/test-completed' || pathname === '/test-completed';

  if (isTestRoute || isCompletionRoute) {
    return (
      <Router basename="/admin">
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
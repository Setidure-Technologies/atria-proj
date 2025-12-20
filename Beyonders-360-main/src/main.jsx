import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AdminApp from './AdminApp.tsx'
import { BeyondersTestComponent } from './components/BeyondersTestComponent.tsx'
import { TestCompletion } from './components/TestCompletion.tsx'
import './index.css'

function App() {
  const basePath = import.meta.env.VITE_BASE_PATH || '/';
  return (
    <Router basename={basePath}>
      <Routes>
        <Route path="/admin/test/:assignmentId" element={<BeyondersTestComponent />} />
        <Route path="/test/:assignmentId" element={<BeyondersTestComponent />} />
        <Route path="/admin/test-completed" element={<TestCompletion />} />
        <Route path="/test-completed" element={<TestCompletion />} />
        <Route path="/*" element={<AdminApp />} />
      </Routes>
    </Router>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
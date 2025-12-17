import { useState } from 'react';
import { StudentInfo } from './components/StudentInfo';

type AppState = 'info' | 'test';

function App() {
  const [state, setState] = useState<AppState>('info');
  
  const handleStart = (name: string, email: string) => {
    console.log('Starting test for:', name, email);
    setState('test');
  };

  if (state === 'info') {
    return <StudentInfo onStart={handleStart} />;
  }

  return <div>Test would go here</div>;
}

export default App;

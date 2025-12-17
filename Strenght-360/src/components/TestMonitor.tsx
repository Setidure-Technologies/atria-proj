import { useEffect } from 'react';

interface TestMonitorProps {
  isActive: boolean;
  onViolation: (violation: string) => void;
}

export function TestMonitor({ isActive, onViolation }: TestMonitorProps) {
  useEffect(() => {
    if (!isActive) return;

    let tabSwitchCount = 0;
    let isTabVisible = true;

    const handleVisibilityChange = () => {
      if (document.hidden && isTabVisible) {
        tabSwitchCount++;
        isTabVisible = false;
        const violation = `Tab/window switched away (${tabSwitchCount} times)`;
        onViolation(violation);
      } else if (!document.hidden) {
        isTabVisible = true;
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your assessment progress may be lost.';
      return e.returnValue;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent common shortcuts that might be used to cheat
      if (
        (e.ctrlKey || e.metaKey) && 
        (e.key === 't' || e.key === 'n' || e.key === 'w' || e.key === 'r' || 
         e.key === 'f' || e.key === 'h' || e.key === 'j' || e.key === 'u')
      ) {
        e.preventDefault();
        const violation = `Attempted keyboard shortcut: Ctrl+${e.key}`;
        onViolation(violation);
      }

      // Prevent F12 (developer tools)
      if (e.key === 'F12') {
        e.preventDefault();
        const violation = 'Attempted to open developer tools';
        onViolation(violation);
      }

      // Prevent Ctrl+Shift+I (developer tools)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        const violation = 'Attempted to open developer tools';
        onViolation(violation);
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const violation = 'Right-click menu attempted';
      onViolation(violation);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [isActive, onViolation]);

  // This component doesn't render anything visible
  return null;
}

export function getViolationSeverity(violation: string): 'low' | 'medium' | 'high' {
  if (violation.includes('Tab/window switched')) {
    const matches = violation.match(/\((\d+) times\)/);
    const count = matches ? parseInt(matches[1]) : 1;
    if (count >= 3) return 'high';
    if (count >= 2) return 'medium';
    return 'low';
  }
  
  if (violation.includes('developer tools') || violation.includes('keyboard shortcut')) {
    return 'high';
  }
  
  if (violation.includes('Right-click menu')) {
    return 'medium';
  }
  
  return 'low';
}

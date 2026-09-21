import React, { createContext, useContext, useState, useEffect } from 'react';

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const [activeProject, setActiveProject] = useState(() => {
    // Initialize from localStorage if available
    const saved = localStorage.getItem('constructiq_active_project');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  // Persist to localStorage whenever it changes
  useEffect(() => {
    if (activeProject) {
      localStorage.setItem('constructiq_active_project', JSON.stringify(activeProject));
    } else {
      localStorage.removeItem('constructiq_active_project');
    }
  }, [activeProject]);

  return (
    <ProjectContext.Provider value={{ activeProject, setActiveProject }}>
      {children}
    </ProjectContext.Provider>
  );
}

export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
}

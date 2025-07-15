import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';

export type ViewType = 'GRAPH' | 'PIE_CHART' | 'CHARACTERISTICS';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewType>('GRAPH');

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleViewChange = (view: ViewType) => {
    setActiveView(view);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 font-inter">
      <Header onToggleSidebar={toggleSidebar} />
      
      <div className="flex">
        <Sidebar 
          isOpen={sidebarOpen}
          activeView={activeView}
          onViewChange={handleViewChange}
          onClose={() => setSidebarOpen(false)}
        />
        
        <MainContent 
          activeView={activeView}
          sidebarOpen={sidebarOpen}
        />
      </div>
    </div>
  );
}

export default App;
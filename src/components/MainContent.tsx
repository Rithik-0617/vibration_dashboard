import React from 'react';
import { ViewType } from '../App';
import GraphView from './GraphView';
import PieChartView from './PieChartView';
import CharacteristicsView from './CharacteristicsView';

interface MainContentProps {
  activeView: ViewType;
  sidebarOpen: boolean;
}

const MainContent: React.FC<MainContentProps> = ({ activeView, sidebarOpen }) => {
  const renderContent = () => {
    switch (activeView) {
      case 'GRAPH':
        return <GraphView />;
      case 'PIE_CHART':
        return <PieChartView />;
      case 'CHARACTERISTICS':
        return <CharacteristicsView />;
      default:
        return <GraphView />;
    }
  };

  return (
    <main className={`
      flex-1 p-6 transition-all duration-300 ease-out min-h-screen
      ${sidebarOpen ? 'lg:ml-0' : 'lg:ml-0'}
    `}>
      <div className="max-w-7xl mx-auto">
        {renderContent()}
      </div>
    </main>
  );
};

export default MainContent;
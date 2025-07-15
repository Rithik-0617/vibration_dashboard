import React from 'react';
import { LineChart, PieChart, BarChart3, X } from 'lucide-react';
import { ViewType } from '../App';

interface SidebarProps {
  isOpen: boolean;
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, activeView, onViewChange, onClose }) => {
  const menuItems = [
    {
      id: 'GRAPH' as ViewType,
      label: 'GRAPH',
      icon: LineChart,
      description: 'FFT & Time Series'
    },
    {
      id: 'PIE_CHART' as ViewType,
      label: 'PIE CHART',
      icon: PieChart,
      description: 'Fault Distribution'
    },
    {
      id: 'CHARACTERISTICS' as ViewType,
      label: 'CHARACTERISTICS',
      icon: BarChart3,
      description: 'Vibration Metrics'
    }
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed lg:relative top-0 left-0 h-full w-80 bg-white shadow-xl z-50
        transform transition-transform duration-300 ease-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        ${isOpen ? '' : 'lg:w-0 lg:overflow-hidden'}
      `}>
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Navigation</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 lg:hidden"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    onClose(); // Close sidebar on mobile after selection
                  }}
                  className={`
                    w-full flex items-center space-x-3 px-4 py-4 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg transform scale-105' 
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }
                  `}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <div className="flex-1 text-left">
                    <div className={`font-medium text-sm ${isActive ? 'text-white' : 'text-gray-800'}`}>
                      {item.label}
                    </div>
                    <div className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                      {item.description}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>
          
          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              Vibration Analysis v2.1
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
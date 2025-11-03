
import React from 'react';

interface DashboardCardProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, icon, children }) => {
  return (
    <div className="bg-vibe-bg-light border border-gray-700 rounded-lg p-6 h-full">
      <div className="flex items-center mb-4">
        <span className="text-vibe-primary mr-3">{icon}</span>
        <h3 className="text-xl font-bold text-white">{title}</h3>
      </div>
      <div className="text-vibe-text-secondary">{children}</div>
    </div>
  );
};

export default DashboardCard;

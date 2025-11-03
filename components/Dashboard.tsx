import React, { useState } from 'react';
import SparkChat from './SparkChat';
import DashboardCard from './DashboardCard';
import { SubscriptionTier } from '../types';
import { BookOpen, User, Megaphone, LogOut, MessageSquare, Mic } from 'lucide-react';
import SparkLive from './SparkLive';
import SalesEmailGenerator from './SalesEmailGenerator';
import { User as FirebaseUser } from 'firebase/auth';

interface DashboardProps {
  subscriptionTier: SubscriptionTier;
  onLogout: () => void;
  user: FirebaseUser;
}

type DashboardType = 'general' | 'sales' | 'trades';
type ActiveView = 'chat' | 'live';

const Dashboard: React.FC<DashboardProps> = ({ subscriptionTier, onLogout, user }) => {
  const [dashboardType, setDashboardType] = useState<DashboardType>('general');
  const [activeView, setActiveView] = useState<ActiveView>('chat');

  const renderSpecializedContent = () => {
    switch (dashboardType) {
      case 'sales':
        return <SalesEmailGenerator />;
      case 'trades':
        return <p>AI-powered job quoting tools, scheduling assistants, and material estimation guides for trades like plumbing will appear here.</p>;
      default:
        return <p>Explore tutorials, FAQs, and guides on using Spark effectively and understanding foundational AI concepts.</p>;
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex flex-col">
      <header className="flex flex-wrap justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Vibe Coding Dashboard</h1>
          <p className="text-vibe-text-secondary">Welcome back, {user.displayName || 'Pro User'}! The future is now.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="relative">
             <select 
               value={dashboardType}
               onChange={(e) => setDashboardType(e.target.value as DashboardType)}
               className="bg-vibe-bg-light border border-gray-600 rounded-md py-2 pl-3 pr-8 text-vibe-text appearance-none focus:outline-none focus:ring-2 focus:ring-vibe-primary"
               disabled={subscriptionTier.name !== 'Spark Pro'}
             >
               <option value="general">General Dashboard</option>
               <option value="sales">Sales Dashboard (Pro)</option>
               <option value="trades">Trades Dashboard (Pro)</option>
             </select>
             <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-vibe-text-secondary">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
             </div>
           </div>
          <button onClick={onLogout} className="flex items-center gap-2 bg-vibe-primary hover:bg-vibe-primary-hover text-white font-semibold py-2 px-4 rounded-lg transition-colors">
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </header>
      
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-vibe-bg-light border border-gray-700 rounded-lg p-2 flex items-center justify-center gap-2">
            <button 
              onClick={() => setActiveView('chat')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${activeView === 'chat' ? 'bg-vibe-primary text-white' : 'text-vibe-text-secondary hover:bg-gray-700'}`}
            >
              <MessageSquare size={16} />
              Spark Chat
            </button>
             <button 
              onClick={() => setActiveView('live')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-semibold transition-colors ${activeView === 'live' ? 'bg-vibe-primary text-white' : 'text-vibe-text-secondary hover:bg-gray-700'}`}
            >
              <Mic size={16} />
              Spark Live
            </button>
          </div>
          {activeView === 'chat' ? <SparkChat /> : <SparkLive />}
        </div>

        <div className="flex flex-col gap-6">
          <DashboardCard title="Learning Resources" icon={<BookOpen />}>
            {renderSpecializedContent()}
            {subscriptionTier.name === 'Spark Basic' && dashboardType !== 'general' && (
              <p className="mt-2 text-sm text-yellow-400">Upgrade to Spark Pro to unlock specialized dashboards.</p>
            )}
          </DashboardCard>
          
          <DashboardCard title="Account Management" icon={<User />}>
            <p>Your current plan: <span className="font-semibold text-vibe-accent">{subscriptionTier.name}</span></p>
            <div className="mt-3 flex gap-2">
              <button className="text-sm bg-vibe-primary hover:bg-vibe-primary-hover text-white py-1 px-3 rounded">Upgrade Plan</button>
              <button className="text-sm bg-vibe-bg-light hover:bg-gray-600 text-vibe-text py-1 px-3 rounded">Update Billing</button>
            </div>
          </DashboardCard>
          
          <DashboardCard title="Announcements" icon={<Megaphone />}>
            <p className="text-sm">New feature update! Spark can now help draft marketing emails. Check the 'Learning Resources' for a guide.</p>
          </DashboardCard>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
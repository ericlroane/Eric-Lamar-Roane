import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import { SubscriptionTier } from './types';
import { auth } from './services/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { Loader2 } from 'lucide-react';

// Hardcoded subscription tier for demonstration purposes for any logged-in user.
const proTier: SubscriptionTier = {
  name: 'Spark Pro',
  price: '$79',
  features: [
    'Priority access to Spark AI Assistant',
    'Advanced AI features & tools',
    'All Learning Resources',
    'Priority Email & Chat Support',
    'Early access to new features',
    'Future: Sales-focused Dashboard',
  ],
  isFeatured: true,
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth).catch((error) => console.error('Logout Error:', error));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-vibe-bg flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-vibe-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-vibe-bg">
      {user ? (
        <Dashboard user={user} subscriptionTier={proTier} onLogout={handleLogout} />
      ) : (
        <LandingPage />
      )}
    </div>
  );
};

export default App;

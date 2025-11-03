import React from 'react';
import { SubscriptionTier } from '../types';
import { CheckCircle } from 'lucide-react';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup } from 'firebase/auth';

const tiers: SubscriptionTier[] = [
  {
    name: 'Spark Basic',
    price: '$29',
    features: [
      'Standard access to Spark AI Assistant',
      'Core Learning Resources',
      'Community Forum Access',
      'Email Support',
    ],
    isFeatured: false,
  },
  {
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
  },
];

const LandingPage: React.FC = () => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Authentication error:", error);
      alert("Could not sign you in. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white">
          Vibe Coding <span className="text-vibe-primary">of Augusta</span>
        </h1>
        <p className="mt-4 text-lg text-vibe-text-secondary max-w-2xl mx-auto">
          Helping you leverage the power of AI for your business. The future is now.
        </p>
        <p className="mt-2 text-sm text-vibe-text-secondary">Owned by Eric Lamar Roane</p>
      </header>

      <main className="w-full max-w-5xl">
        <h2 className="text-3xl font-bold text-center text-white mb-8">Meet Spark - Your AI Personal Assistant</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`bg-vibe-bg-light rounded-2xl p-8 border ${
                tier.isFeatured ? 'border-vibe-primary shadow-2xl shadow-vibe-primary/20' : 'border-gray-700'
              } flex flex-col`}
            >
              {tier.isFeatured && (
                <div className="text-center mb-4">
                  <span className="bg-vibe-primary text-white text-sm font-semibold px-4 py-1 rounded-full">Most Popular</span>
                </div>
              )}
              <h3 className="text-2xl font-bold text-white text-center">{tier.name}</h3>
              <p className="text-center my-4">
                <span className="text-4xl font-extrabold text-white">{tier.price}</span>
                <span className="text-vibe-text-secondary">/month</span>
              </p>
              <ul className="space-y-4 my-6 text-vibe-text flex-grow">
                {tier.features.map((feature) => (
                  <li key={feature} className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-vibe-accent mr-3 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={handleLogin}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-lg transition-transform duration-200 hover:scale-105 ${
                  tier.isFeatured
                    ? 'bg-vibe-primary text-white hover:bg-vibe-primary-hover'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                Get Started with Google
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
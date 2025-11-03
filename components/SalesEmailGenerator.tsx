import React, { useState } from 'react';
import { generateSalesEmails } from '../services/geminiService';
import CopyButton from './CopyButton';
import { Loader2, Mail } from 'lucide-react';

interface GeneratedEmails {
  cold: string;
  followup: string;
  thank_you: string;
}

const SalesEmailGenerator: React.FC = () => {
  const [product, setProduct] = useState('');
  const [audience, setAudience] = useState('');
  const [sellingPoints, setSellingPoints] = useState('');
  const [tone, setTone] = useState('Professional');
  const [generatedEmails, setGeneratedEmails] = useState<GeneratedEmails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !audience || !sellingPoints) return;
    setIsLoading(true);
    setError(null);
    setGeneratedEmails(null);

    try {
      const emails = await generateSalesEmails(product, audience, sellingPoints, tone);
      setGeneratedEmails(emails);
    } catch (err) {
      setError('Failed to generate emails. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const EmailCard = ({ title, content }: { title: string; content: string }) => (
    <div className="bg-vibe-bg border border-gray-600 rounded-lg p-4 mt-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-semibold text-vibe-text">{title}</h4>
        <CopyButton textToCopy={content} />
      </div>
      <pre className="text-sm whitespace-pre-wrap font-sans text-vibe-text-secondary">{content}</pre>
    </div>
  );


  return (
    <div>
      <p className="text-sm mb-4">
        Generate professional sales emails in seconds. Fill out the details below and let Spark craft the perfect message for your audience.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="product" className="block text-sm font-medium text-vibe-text-secondary mb-1">Product/Service Name</label>
          <input
            id="product"
            type="text"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            placeholder="e.g., AI-Powered CRM"
            required
            className="w-full bg-vibe-bg border border-gray-600 rounded-lg p-2 text-vibe-text focus:outline-none focus:ring-1 focus:ring-vibe-primary"
          />
        </div>
        <div>
          <label htmlFor="audience" className="block text-sm font-medium text-vibe-text-secondary mb-1">Target Audience</label>
          <input
            id="audience"
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g., Small Business Owners"
            required
            className="w-full bg-vibe-bg border border-gray-600 rounded-lg p-2 text-vibe-text focus:outline-none focus:ring-1 focus:ring-vibe-primary"
          />
        </div>
        <div>
          <label htmlFor="selling-points" className="block text-sm font-medium text-vibe-text-secondary mb-1">Key Selling Points</label>
          <textarea
            id="selling-points"
            rows={3}
            value={sellingPoints}
            onChange={(e) => setSellingPoints(e.target.value)}
            placeholder="e.g., - Saves 10 hours per week&#10;- Increases sales by 20%&#10;- Easy to use"
            required
            className="w-full bg-vibe-bg border border-gray-600 rounded-lg p-2 text-vibe-text focus:outline-none focus:ring-1 focus:ring-vibe-primary"
          />
        </div>
        <div>
          <label htmlFor="tone" className="block text-sm font-medium text-vibe-text-secondary mb-1">Email Tone</label>
          <select
            id="tone"
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="w-full bg-vibe-bg border border-gray-600 rounded-lg p-2 text-vibe-text focus:outline-none focus:ring-1 focus:ring-vibe-primary"
          >
            <option>Professional</option>
            <option>Friendly</option>
            <option>Persuasive</option>
            <option>Enthusiastic</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-vibe-primary hover:bg-vibe-primary-hover text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <Mail />}
          {isLoading ? 'Generating...' : 'Generate Emails'}
        </button>
      </form>

      {error && <p className="text-red-400 text-center mt-4">{error}</p>}
      
      {generatedEmails && (
        <div className="mt-6">
          <EmailCard title="Cold Outreach Email" content={generatedEmails.cold} />
          <EmailCard title="Follow-up Email" content={generatedEmails.followup} />
          <EmailCard title="Thank You Email" content={generatedEmails.thank_you} />
        </div>
      )}
    </div>
  );
};

export default SalesEmailGenerator;

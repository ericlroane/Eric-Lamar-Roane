import React, { useState } from 'react';
import { Clipboard, Check } from 'lucide-react';

interface CopyButtonProps {
  textToCopy: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy }) => {
  const [isCopied, setIsCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <button
      onClick={copy}
      className="flex items-center gap-2 bg-vibe-bg-light hover:bg-gray-600 text-vibe-text-secondary font-semibold py-1 px-3 rounded-lg transition-colors text-sm"
      aria-label={isCopied ? 'Copied!' : 'Copy text'}
    >
      {isCopied ? <Check size={16} className="text-vibe-accent" /> : <Clipboard size={16} />}
      {isCopied ? 'Copied!' : 'Copy'}
    </button>
  );
};

export default CopyButton;

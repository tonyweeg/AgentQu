import React from 'react';

interface SharedHeaderProps {
  onLogoClick?: () => void;
}

const SharedHeader: React.FC<SharedHeaderProps> = ({ onLogoClick }) => {
  const handleLogoClick = () => {
    if (onLogoClick) {
      onLogoClick();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity cursor-pointer"
          >
            <img
              src="/agentqu-glyph.png"
              alt="AgentQu"
              className="h-8 w-8 hidden lg:block"
            />
            <h1 className="text-2xl sm:text-3xl font-bold text-black" style={{ letterSpacing: '-0.05em' }}>AgentQu</h1>
          </button>

          {/* Right side - Corporate links */}
          <div className="flex items-center gap-4">
            <a
              href="/"
              className="text-sm font-medium text-gray-700 hover:text-ocean-bright transition-colors"
            >
              Home
            </a>
            <a
              href="/contact"
              className="text-sm font-medium text-gray-700 hover:text-ocean-bright transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </div>
    </header>
  );
};

export default SharedHeader;

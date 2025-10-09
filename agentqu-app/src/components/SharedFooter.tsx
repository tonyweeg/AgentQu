import React from 'react';

const SharedFooter: React.FC = () => {
  return (
    <footer className="bg-navy-text text-white mt-12 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          {/* About */}
          <div>
            <h3 className="font-bold text-xl mb-3">AgentQu</h3>
            <p className="text-gray-300 text-sm">
              Discover amazing activities near you with personalized recommendations powered by AI.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-lg mb-3">Legal</h3>
            <div className="space-y-2">
              <a href="/privacy" className="block text-gray-300 hover:text-white text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="block text-gray-300 hover:text-white text-sm transition-colors">
                Terms of Service
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-lg mb-3">Get in Touch</h3>
            <div className="space-y-2">
              <a href="/contact" className="block text-gray-300 hover:text-white text-sm transition-colors">
                Contact Us
              </a>
              <a href="mailto:support@agentqu.com" className="block text-gray-300 hover:text-white text-sm transition-colors">
                support@agentqu.com
              </a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 pt-6 text-center text-sm text-gray-400">
          <p>© {new Date().getFullYear()} AgentQu. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default SharedFooter;

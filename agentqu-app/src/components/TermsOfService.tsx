import React from 'react';

const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <img
            src="/agentqu-logo.png"
            alt="AgentQu Logo"
            className="h-16 mx-auto mb-6"
          />
          <h1 className="text-4xl font-bold text-navy-text mb-2">Terms of Service</h1>
          <p className="text-gray-600">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 leading-relaxed mb-6">
            Welcome to AgentQu! These Terms of Service ("Terms") govern your access to and use of our website, mobile application, and services (collectively, the "Service"). By accessing or using the Service, you agree to be bound by these Terms.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700 mb-4">
              By creating an account or using the Service, you acknowledge that you have read, understood, and agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you may not access or use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">2. Eligibility</h2>
            <p className="text-gray-700 mb-4">
              You must be at least 13 years old to use the Service. If you are under 18, you must have permission from a parent or legal guardian. By using the Service, you represent and warrant that you meet these requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">3. User Accounts</h2>

            <h3 className="text-xl font-semibold text-navy-text mb-3">Account Creation</h3>
            <p className="text-gray-700 mb-4">
              You may create an account using Google OAuth or other supported authentication methods. You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Maintaining the security of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized access</li>
            </ul>

            <h3 className="text-xl font-semibold text-navy-text mb-3">Account Termination</h3>
            <p className="text-gray-700 mb-4">
              We reserve the right to suspend or terminate your account at any time for violation of these Terms or for any other reason at our sole discretion.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">4. Use of the Service</h2>

            <h3 className="text-xl font-semibold text-navy-text mb-3">Permitted Use</h3>
            <p className="text-gray-700 mb-4">
              You may use the Service for lawful purposes only. The Service provides:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Activity discovery based on your location and preferences</li>
              <li>Personalized recommendations using affinity scoring</li>
              <li>Trip planning features (There-Then)</li>
              <li>Social features including Cirqles (family/friend groups)</li>
              <li>Reviews, ratings, and activity sharing</li>
            </ul>

            <h3 className="text-xl font-semibold text-navy-text mb-3">Prohibited Conduct</h3>
            <p className="text-gray-700 mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Violate any laws or regulations</li>
              <li>Post harmful, offensive, or inappropriate content</li>
              <li>Harass, bully, or threaten other users</li>
              <li>Upload malware or malicious code</li>
              <li>Scrape, crawl, or harvest data from the Service</li>
              <li>Impersonate others or create fake accounts</li>
              <li>Interfere with the Service's operation or security</li>
              <li>Use the Service for commercial purposes without permission</li>
              <li>Share false or misleading information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">5. User Content</h2>

            <h3 className="text-xl font-semibold text-navy-text mb-3">Your Content</h3>
            <p className="text-gray-700 mb-4">
              You retain ownership of content you post ("User Content"), including reviews, photos, ratings, and other submissions. By posting User Content, you grant us a worldwide, non-exclusive, royalty-free license to use, display, and distribute your content in connection with the Service.
            </p>

            <h3 className="text-xl font-semibold text-navy-text mb-3">Content Standards</h3>
            <p className="text-gray-700 mb-4">
              All User Content must:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Be accurate and truthful</li>
              <li>Not infringe on others' rights</li>
              <li>Not contain profanity (we use automatic filtering)</li>
              <li>Not be spam or promotional content</li>
              <li>Comply with all applicable laws</li>
            </ul>

            <h3 className="text-xl font-semibold text-navy-text mb-3">Content Moderation</h3>
            <p className="text-gray-700 mb-4">
              We reserve the right to remove any User Content that violates these Terms or is otherwise objectionable. We use automated profanity filtering and manual moderation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">6. Location Data</h2>
            <p className="text-gray-700 mb-4">
              The Service requires access to your device's location to function properly. By using the Service, you consent to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Collection and processing of your location data</li>
              <li>Use of location data for activity discovery and recommendations</li>
              <li>Caching of location data for performance optimization</li>
            </ul>
            <p className="text-gray-700 mb-4">
              You can disable location services in your device settings, but this may limit functionality.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">7. Third-Party Services</h2>
            <p className="text-gray-700 mb-4">
              The Service integrates with third-party services including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Google Maps, Places API, and Geocoding API</li>
              <li>Firebase (Authentication, Firestore, Cloud Functions, Hosting)</li>
              <li>OpenWeather API</li>
            </ul>
            <p className="text-gray-700 mb-4">
              Your use of these third-party services is subject to their respective terms of service. We are not responsible for third-party services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">8. Intellectual Property</h2>

            <h3 className="text-xl font-semibold text-navy-text mb-3">Our Rights</h3>
            <p className="text-gray-700 mb-4">
              The Service, including its design, features, algorithms, and code, is owned by AgentQu and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, or create derivative works without permission.
            </p>

            <h3 className="text-xl font-semibold text-navy-text mb-3">Trademarks</h3>
            <p className="text-gray-700 mb-4">
              "AgentQu" and our logo are trademarks. You may not use our trademarks without written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">9. Disclaimers</h2>

            <h3 className="text-xl font-semibold text-navy-text mb-3">"As Is" Service</h3>
            <p className="text-gray-700 mb-4">
              THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
            </p>

            <h3 className="text-xl font-semibold text-navy-text mb-3">Activity Information</h3>
            <p className="text-gray-700 mb-4">
              Activity information is sourced from Google Places API and user submissions. We do not guarantee accuracy, completeness, or reliability of this information. Always verify details before visiting.
            </p>

            <h3 className="text-xl font-semibold text-navy-text mb-3">No Professional Advice</h3>
            <p className="text-gray-700 mb-4">
              The Service provides recommendations for entertainment purposes. It is not professional travel, medical, or safety advice. Use your own judgment.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">10. Limitation of Liability</h2>
            <p className="text-gray-700 mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, AGENTQU SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES.
            </p>
            <p className="text-gray-700 mb-4">
              IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID US IN THE PAST 12 MONTHS (OR $100 IF YOU HAVE NOT PAID US).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">11. Indemnification</h2>
            <p className="text-gray-700 mb-4">
              You agree to indemnify and hold harmless AgentQu from any claims, damages, losses, or expenses (including attorneys' fees) arising from:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your User Content</li>
              <li>Your violation of any rights of another party</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">12. Changes to Terms</h2>
            <p className="text-gray-700 mb-4">
              We may modify these Terms at any time. We will notify you of material changes by posting a notice in the Service or sending you an email. Your continued use after changes constitutes acceptance.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">13. Governing Law</h2>
            <p className="text-gray-700 mb-4">
              These Terms are governed by the laws of the State of Delaware, United States, without regard to conflict of law principles. Any disputes shall be resolved in the courts of Delaware.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">14. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about these Terms, please contact us at:
            </p>
            <div className="bg-ocean-bright/10 border-2 border-ocean-bright/30 rounded-lg p-4">
              <p className="text-navy-text font-medium mb-1">AgentQu</p>
              <p className="text-gray-700">Email: <a href="mailto:legal@agentqu.com" className="text-ocean-bright hover:text-ocean-mid font-medium">legal@agentqu.com</a></p>
              <p className="text-gray-700">Website: <a href="/" className="text-ocean-bright hover:text-ocean-mid font-medium">agentqu.com</a></p>
            </div>
          </section>
        </div>

        {/* Back Button */}
        <div className="mt-8 pt-6 border-t">
          <button
            onClick={() => window.history.back()}
            className="bg-ocean-bright hover:bg-ocean-mid text-white font-bold py-3 px-6 rounded-lg transition-colors"
          >
            ← Back to AgentQu
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;

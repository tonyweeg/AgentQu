import React from 'react';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-8 md:p-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-navy-text mb-2">Privacy Policy</h1>
          <p className="text-gray-600">Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        {/* Content */}
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 leading-relaxed mb-6">
            At AgentQu, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and website.
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">1. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-navy-text mb-3">Personal Information</h3>
            <p className="text-gray-700 mb-4">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Name and email address (when you create an account)</li>
              <li>Profile information and preferences</li>
              <li>Activity ratings and affinity preferences</li>
              <li>Photos and content you upload</li>
              <li>Communications with us</li>
            </ul>

            <h3 className="text-xl font-semibold text-navy-text mb-3">Location Information</h3>
            <p className="text-gray-700 mb-4">
              With your permission, we collect and process information about your precise location using GPS, Wi-Fi, and other location services. We use this information to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Discover activities and places near you</li>
              <li>Provide personalized recommendations</li>
              <li>Calculate distances to activities</li>
              <li>Show you on maps</li>
            </ul>

            <h3 className="text-xl font-semibold text-navy-text mb-3">Usage Information</h3>
            <p className="text-gray-700 mb-4">
              We automatically collect certain information about your device and how you interact with our services:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Device type, operating system, and browser</li>
              <li>IP address and device identifiers</li>
              <li>Pages viewed and features used</li>
              <li>Search queries and activity interactions</li>
              <li>Date and time of visits</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700 mb-4">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Personalize your experience and recommendations</li>
              <li>Discover activities based on your location and preferences</li>
              <li>Calculate affinity-based scores for activities</li>
              <li>Send you updates, notifications, and marketing communications (with your consent)</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, prevent, and address technical issues and fraudulent activity</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">3. Information Sharing and Disclosure</h2>

            <h3 className="text-xl font-semibold text-navy-text mb-3">We Do Not Sell Your Personal Information</h3>
            <p className="text-gray-700 mb-4">
              We do not sell, rent, or trade your personal information to third parties.
            </p>

            <h3 className="text-xl font-semibold text-navy-text mb-3">We May Share Information With:</h3>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Service Providers:</strong> Third-party vendors who perform services on our behalf (e.g., Google Maps API, Firebase, hosting providers)</li>
              <li><strong>Your Cirqle:</strong> Members of your family/friend groups (Cirqles) that you create or join</li>
              <li><strong>Other Users:</strong> When you post reviews, photos, or other content publicly</li>
              <li><strong>Legal Requirements:</strong> When required by law, court order, or to protect our rights</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">4. Third-Party Services</h2>
            <p className="text-gray-700 mb-4">
              Our service integrates with third-party services:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li><strong>Google Services:</strong> Google Maps, Places API, Geocoding API, Firebase</li>
              <li><strong>OpenWeather API:</strong> Weather and environmental data</li>
            </ul>
            <p className="text-gray-700 mb-4">
              These third parties have their own privacy policies. We encourage you to review them.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">5. Data Security</h2>
            <p className="text-gray-700 mb-4">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc pl-6 text-gray-700 space-y-2 mb-4">
              <li>Encryption of data in transit and at rest</li>
              <li>Firebase Authentication for secure user authentication</li>
              <li>Firestore Security Rules to control data access</li>
              <li>Regular security audits and updates</li>
            </ul>
            <p className="text-gray-700 mb-4">
              However, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">6. Your Rights and Choices</h2>

            <h3 className="text-xl font-semibold text-navy-text mb-3">Access and Update</h3>
            <p className="text-gray-700 mb-4">
              You can access and update your account information through the Settings page in the app.
            </p>

            <h3 className="text-xl font-semibold text-navy-text mb-3">Location Permissions</h3>
            <p className="text-gray-700 mb-4">
              You can enable or disable location services through your device settings. Note that disabling location services may limit certain features.
            </p>

            <h3 className="text-xl font-semibold text-navy-text mb-3">Marketing Communications</h3>
            <p className="text-gray-700 mb-4">
              You can opt out of marketing emails by following the unsubscribe link in our emails or contacting us directly.
            </p>

            <h3 className="text-xl font-semibold text-navy-text mb-3">Data Deletion</h3>
            <p className="text-gray-700 mb-4">
              You can request deletion of your account and personal data by contacting us at <a href="mailto:privacy@agentqu.com" className="text-ocean-bright hover:text-ocean-mid font-medium">privacy@agentqu.com</a>
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">7. Children's Privacy</h2>
            <p className="text-gray-700 mb-4">
              Our service is not directed to children under 13. We do not knowingly collect personal information from children under 13. If we learn that we have collected personal information from a child under 13, we will delete it promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">8. International Data Transfers</h2>
            <p className="text-gray-700 mb-4">
              Your information may be transferred to and processed in countries other than your country of residence. These countries may have different data protection laws. By using our service, you consent to such transfers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">9. Changes to This Privacy Policy</h2>
            <p className="text-gray-700 mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date.
            </p>
            <p className="text-gray-700 mb-4">
              Your continued use of our service after changes constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-navy-text mb-4">10. Contact Us</h2>
            <p className="text-gray-700 mb-4">
              If you have questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <div className="bg-ocean-bright/10 border-2 border-ocean-bright/30 rounded-lg p-4">
              <p className="text-navy-text font-medium mb-1">AgentQu</p>
              <p className="text-gray-700">Email: <a href="mailto:privacy@agentqu.com" className="text-ocean-bright hover:text-ocean-mid font-medium">privacy@agentqu.com</a></p>
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

export default PrivacyPolicy;

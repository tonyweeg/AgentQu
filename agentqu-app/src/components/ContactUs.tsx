import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const ContactUs: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);

    // Simulate sending (in production, you'd call a Cloud Function)
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log('Contact form submitted:', formData);
    setSubmitted(true);
    setSending(false);

    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({
        name: user?.displayName || '',
        email: user?.email || '',
        subject: '',
        message: ''
      });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ocean-bright/10 to-seafoam/30 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-navy-text mb-4">Get in Touch</h1>
          <p className="text-xl text-gray-600">We'd love to hear from you! Reach out anytime.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-bold text-navy-text mb-6">Send Us a Message</h2>

            {submitted ? (
              <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 text-center">
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Message Sent!</h3>
                <p className="text-green-700">We'll get back to you as soon as possible.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-ocean-bright focus:outline-none"
                    placeholder="John Doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-ocean-bright focus:outline-none"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Subject *
                  </label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-ocean-bright focus:outline-none"
                  >
                    <option value="">Select a topic...</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="feature">Feature Request</option>
                    <option value="bug">Bug Report</option>
                    <option value="partnership">Partnership Inquiry</option>
                    <option value="privacy">Privacy Concern</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-ocean-bright focus:outline-none resize-none"
                    placeholder="Tell us what's on your mind..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-ocean-bright hover:bg-ocean-mid text-white font-bold py-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {sending ? '📤 Sending...' : '📬 Send Message'}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info & Quick Links */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-navy-text mb-6">Contact Information</h2>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="text-3xl">📧</div>
                  <div>
                    <h3 className="font-bold text-navy-text mb-1">Email</h3>
                    <a href="mailto:support@agentqu.com" className="text-ocean-bright hover:text-ocean-mid font-medium">
                      support@agentqu.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="text-3xl">🌐</div>
                  <div>
                    <h3 className="font-bold text-navy-text mb-1">Website</h3>
                    <a href="/" className="text-ocean-bright hover:text-ocean-mid font-medium">
                      www.agentqu.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="text-3xl">💬</div>
                  <div>
                    <h3 className="font-bold text-navy-text mb-1">Support Hours</h3>
                    <p className="text-gray-700">Monday - Friday</p>
                    <p className="text-gray-700">9:00 AM - 6:00 PM EST</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold text-navy-text mb-6">Quick Links</h2>

              <div className="space-y-3">
                <a
                  href="/privacy"
                  className="block p-3 bg-ocean-bright/10 hover:bg-ocean-bright/20 rounded-lg transition-colors"
                >
                  <span className="font-medium text-navy-text">🔒 Privacy Policy</span>
                </a>
                <a
                  href="/terms"
                  className="block p-3 bg-ocean-bright/10 hover:bg-ocean-bright/20 rounded-lg transition-colors"
                >
                  <span className="font-medium text-navy-text">📄 Terms of Service</span>
                </a>
                <a
                  href="/test-harness"
                  className="block p-3 bg-ocean-bright/10 hover:bg-ocean-bright/20 rounded-lg transition-colors"
                >
                  <span className="font-medium text-navy-text">🧪 Test Harness</span>
                </a>
              </div>
            </div>

            {/* Social Media / Future */}
            <div className="bg-gradient-to-br from-ocean-bright to-ocean-mid text-white rounded-2xl shadow-xl p-8">
              <h2 className="text-2xl font-bold mb-4">Stay Connected</h2>
              <p className="mb-4">Follow us for updates, tips, and new features!</p>
              <div className="flex gap-4">
                <button className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm py-3 rounded-lg font-medium transition-colors">
                  Twitter
                </button>
                <button className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm py-3 rounded-lg font-medium transition-colors">
                  Instagram
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.history.back()}
            className="bg-white hover:bg-gray-50 text-navy-text font-bold py-3 px-8 rounded-lg shadow-lg transition-colors border-2 border-gray-200"
          >
            ← Back to AgentQu
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;

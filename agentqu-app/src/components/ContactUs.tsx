import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../lib/firebase';

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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError(null);

    try {
      console.log('📧 CONTACT_FORM: Submitting contact form...', formData);

      const sendContactEmail = httpsCallable(functions, 'sendContactEmail');
      const result = await sendContactEmail({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message
      });

      console.log('✅ CONTACT_FORM: Email sent successfully!', result.data);
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
    } catch (err: any) {
      console.error('❌ CONTACT_FORM: Failed to send email:', err);
      setError(err.message || 'Failed to send message. Please try again.');
      setSending(false);
    }
  };

  return (
    <div className="py-12 px-4 min-h-screen relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-blue-900/20"></div>

      {/* Animated orbs for depth */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-400/30 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-pink-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Page Title - Logo with Agent Q Background */}
        <div className="text-center mb-12">
          <div
            className="relative w-full max-w-4xl mx-auto bg-transparent rounded-3xl px-8 py-6 border border-white/20 shadow-2xl overflow-hidden"
            style={{
              backgroundImage: 'url(/agent-q-robot-banner.png)',
              backgroundSize: 'auto 150%',
              backgroundPosition: 'calc(50% - 200px) calc(50% + 50px)',
              backgroundRepeat: 'no-repeat'
            }}
          >
            {/* Gradient fade on right edge - 75px fade to transparent */}
            <div className="absolute inset-y-0 right-0 w-[75px] bg-gradient-to-r from-transparent to-white/100 dark:to-gray-900/100 rounded-r-3xl pointer-events-none"></div>

            {/* Content - right aligned with text shadow for readability */}
            <div className="relative z-10 flex flex-col items-end text-right">
              <img
                src="/agentqu-logo.png"
                alt="AgentQu"
                className="h-20 w-auto mb-3 drop-shadow-lg"
              />
              <p className="text-xl text-gray-800 dark:text-gray-100 font-bold drop-shadow-lg">
                We'd love to hear from you! ✨
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Form - Ultimate Glassmorphism */}
          <div className="bg-white/30 dark:bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl p-8 hover:shadow-3xl transition-all duration-300">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
              <span className="text-4xl">💬</span>
              Send Us a Message
            </h2>

            {submitted ? (
              <div className="bg-green-500/20 backdrop-blur-xl border-2 border-green-400/50 rounded-2xl p-8 text-center shadow-lg">
                <div className="text-7xl mb-4 animate-bounce">✅</div>
                <h3 className="text-2xl font-bold text-green-700 dark:text-green-300 mb-2">Message Sent!</h3>
                <p className="text-green-600 dark:text-green-200 text-lg">We'll get back to you as soon as possible.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Error Message */}
                {error && (
                  <div className="bg-red-500/20 backdrop-blur-xl border-2 border-red-400/50 rounded-2xl p-4 shadow-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">❌</span>
                      <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
                    </div>
                  </div>
                )}

                {/* Name */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <span className="text-lg">👤</span>
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white/50 dark:bg-white/10 backdrop-blur-xl border-2 border-white/40 rounded-2xl focus:border-ocean-bright focus:ring-2 focus:ring-ocean-bright/30 focus:outline-none text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-lg transition-all"
                    placeholder="John Doe"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <span className="text-lg">📧</span>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white/50 dark:bg-white/10 backdrop-blur-xl border-2 border-white/40 rounded-2xl focus:border-ocean-bright focus:ring-2 focus:ring-ocean-bright/30 focus:outline-none text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-lg transition-all"
                    placeholder="john@example.com"
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    Subject *
                  </label>
                  <select
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white/50 dark:bg-white/10 backdrop-blur-xl border-2 border-white/40 rounded-2xl focus:border-ocean-bright focus:ring-2 focus:ring-ocean-bright/30 focus:outline-none text-gray-800 dark:text-white shadow-lg transition-all"
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
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-200 mb-2 flex items-center gap-2">
                    <span className="text-lg">✍️</span>
                    Message *
                  </label>
                  <textarea
                    required
                    rows={6}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-5 py-3.5 bg-white/50 dark:bg-white/10 backdrop-blur-xl border-2 border-white/40 rounded-2xl focus:border-ocean-bright focus:ring-2 focus:ring-ocean-bright/30 focus:outline-none text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-lg transition-all resize-none"
                    placeholder="Tell us what's on your mind..."
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full bg-gradient-to-r from-ocean-bright via-purple-600 to-pink-600 hover:from-ocean-mid hover:via-purple-700 hover:to-pink-700 text-white font-bold py-4 rounded-2xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-3xl hover:scale-105 transform"
                >
                  {sending ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      Sending...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <span>📬</span>
                      Send Message
                    </span>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Contact Info & Quick Links */}
          <div className="space-y-6">
            {/* Contact Information - Glassmorphism */}
            <div className="bg-white/30 dark:bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl p-8 hover:shadow-3xl transition-all duration-300">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
                <span className="text-4xl">📞</span>
                Contact Information
              </h2>

              <div className="space-y-6">
                <div className="flex items-start gap-4 bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/20 hover:border-ocean-bright/50 transition-all shadow-lg">
                  <div className="text-4xl">📧</div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white mb-1">Email</h3>
                    <a href="mailto:hello@tonyweeg.com" className="text-ocean-bright hover:text-ocean-mid dark:text-blue-400 dark:hover:text-blue-300 font-medium text-lg">
                      hello@tonyweeg.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/20 hover:border-ocean-bright/50 transition-all shadow-lg">
                  <div className="text-4xl">🌐</div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white mb-1">Website</h3>
                    <a href="https://agentqu-platform.web.app" className="text-ocean-bright hover:text-ocean-mid dark:text-blue-400 dark:hover:text-blue-300 font-medium text-lg">
                      agentqu-platform.web.app
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4 bg-white/40 dark:bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/20 hover:border-ocean-bright/50 transition-all shadow-lg">
                  <div className="text-4xl">💬</div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white mb-1">Support Hours</h3>
                    <p className="text-gray-700 dark:text-gray-300">Monday - Friday</p>
                    <p className="text-gray-700 dark:text-gray-300">9:00 AM - 6:00 PM EST</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links - Glassmorphism */}
            <div className="bg-white/30 dark:bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl p-8 hover:shadow-3xl transition-all duration-300">
              <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-3">
                <span className="text-4xl">🔗</span>
                Quick Links
              </h2>

              <div className="space-y-3">
                <a
                  href="/privacy"
                  className="block p-4 bg-white/40 dark:bg-white/10 backdrop-blur-xl hover:bg-white/60 dark:hover:bg-white/20 rounded-2xl transition-all border border-white/20 hover:border-ocean-bright/50 shadow-lg hover:shadow-xl group"
                >
                  <span className="font-bold text-gray-800 dark:text-white flex items-center gap-3 text-lg">
                    <span className="text-2xl group-hover:scale-110 transition-transform">🔒</span>
                    Privacy Policy
                  </span>
                </a>
                <a
                  href="/terms"
                  className="block p-4 bg-white/40 dark:bg-white/10 backdrop-blur-xl hover:bg-white/60 dark:hover:bg-white/20 rounded-2xl transition-all border border-white/20 hover:border-ocean-bright/50 shadow-lg hover:shadow-xl group"
                >
                  <span className="font-bold text-gray-800 dark:text-white flex items-center gap-3 text-lg">
                    <span className="text-2xl group-hover:scale-110 transition-transform">📄</span>
                    Terms of Service
                  </span>
                </a>
              </div>
            </div>

            {/* Stay Connected - Glassmorphism Card */}
            <div className="bg-gradient-to-br from-ocean-bright/90 via-purple-600/90 to-pink-600/90 backdrop-blur-2xl text-white rounded-3xl border border-white/30 shadow-2xl p-8 hover:shadow-3xl transition-all duration-300">
              <h2 className="text-3xl font-bold mb-4 flex items-center gap-3">
                <span className="text-4xl">✨</span>
                Stay Connected
              </h2>
              <p className="mb-6 text-lg text-white/90">Follow us for updates, tips, and new features!</p>
              <div className="flex gap-3">
                <button className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-xl py-3 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 transform border border-white/30">
                  Twitter
                </button>
                <button className="flex-1 bg-white/20 hover:bg-white/30 backdrop-blur-xl py-3 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 transform border border-white/30">
                  Instagram
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;

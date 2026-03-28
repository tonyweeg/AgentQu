/**
 * Home Page - Landing
 * PoliScai - Democracy V2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui';
import {
  BookOpen,
  Search,
  Users,
  Scale,
  LogIn,
  ArrowRight,
  Shield,
  Eye,
  FileText,
} from 'lucide-react';

export function Home() {
  const { isAuthenticated, signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-poliscai-light">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-poliscai-primary to-poliscai-primary/90 text-white">
        <div className="max-w-6xl mx-auto px-4 py-20 sm:py-28">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-bold mb-6">
              PoliSc<span className="text-poliscai-secondary">AI</span>
            </h1>
            <p className="text-xl sm:text-2xl text-poliscai-secondary font-medium mb-4">
              Democracy V2.0
            </p>
            <p className="text-lg sm:text-xl text-white/80 max-w-3xl mx-auto mb-8">
              A community-governed, AI-assisted constitutional scholarship platform.
              Surface hidden assumptions. Propose unambiguous language.
              Hold a mirror up to the Constitution.
              <span className="block mt-4 text-poliscai-secondary font-semibold">
                Collectively, we will help create Version 2.0 of the Constitution.
              </span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/constitution"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 text-lg font-medium rounded-lg bg-poliscai-secondary text-poliscai-dark hover:bg-poliscai-secondary/90 transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                Read the Constitution
              </Link>
              {isAuthenticated ? (
                <Link
                  to="/discover"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-lg font-medium rounded-lg border-2 border-white text-white hover:bg-white/10 transition-colors"
                >
                  <Search className="w-5 h-5" />
                  Explore Shadow Notes
                </Link>
              ) : (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white/10"
                  icon={<LogIn className="w-5 h-5" />}
                  onClick={signInWithGoogle}
                >
                  Sign In to Participate
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Wave decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 100V50C240 16.667 480 0 720 0C960 0 1200 16.667 1440 50V100H0Z"
              fill="#f5f5f5"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-serif font-bold text-center text-poliscai-dark mb-12">
            What is PoliSc<span className="text-poliscai-primary">AI</span>?
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-poliscai-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-poliscai-primary" />
              </div>
              <h3 className="text-xl font-semibold text-poliscai-dark mb-2">
                Surface the Shadow
              </h3>
              <p className="text-gray-600">
                Discover hidden assumptions, biases, and exclusions embedded in the original
                Constitution. See what was written and what was meant.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-poliscai-secondary/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-poliscai-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-poliscai-dark mb-2">
                Community Scholarship
              </h3>
              <p className="text-gray-600">
                Submit findings, vote on proposals, and build a permanent public record.
                Every citizen can contribute to constitutional clarity.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-shadow-approved/10 rounded-lg flex items-center justify-center mb-4">
                <Scale className="w-6 h-6 text-shadow-approved" />
              </div>
              <h3 className="text-xl font-semibold text-poliscai-dark mb-2">
                AI Constitutionality Check
              </h3>
              <p className="text-gray-600">
                Query any law or text for constitutional alignment. Get cited, scored,
                transparent analysis against V2.0 and the UN Declaration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principles */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-serif font-bold text-center text-poliscai-dark mb-12">
            Core Principles
          </h2>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-poliscai-primary text-white rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold text-poliscai-dark mb-1">The Human Is the Author</h3>
                <p className="text-gray-600">
                  V2.0 constitutional language is drafted by human contributors and approved by the
                  community. AI checks against the canon — it never writes it.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-poliscai-primary text-white rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold text-poliscai-dark mb-1">The Shadow Is Always Visible</h3>
                <p className="text-gray-600">
                  V1.0 original text is never hidden, altered, or deprecated. It lives permanently
                  alongside V2.0. The record is always complete.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-poliscai-primary text-white rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold text-poliscai-dark mb-1">Nothing Is Deleted</h3>
                <p className="text-gray-600">
                  Every submission, vote, dispute, and counter-argument is an immutable public record.
                  Status changes are appended, not overwritten.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 bg-poliscai-primary text-white rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <h3 className="font-semibold text-poliscai-dark mb-1">Equal Personhood</h3>
                <p className="text-gray-600">
                  All human persons are equal under the law regardless of gender, race, ethnicity,
                  national origin, economic status, age, or religion.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Shield className="w-16 h-16 text-poliscai-primary mx-auto mb-6" />
          <h2 className="text-3xl font-serif font-bold text-poliscai-dark mb-4">
            Ready to Participate?
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join the community of constitutional scholars. Read the document, discover shadows,
            submit findings, and help build a more perfect understanding.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/constitution"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 text-lg font-medium rounded-lg bg-poliscai-primary text-white hover:bg-poliscai-primary/90 transition-colors"
            >
              <FileText className="w-5 h-5" />
              Start Reading
              <ArrowRight className="w-5 h-5" />
            </Link>
            {!isAuthenticated && (
              <Button
                size="lg"
                variant="outline"
                icon={<LogIn className="w-5 h-5" />}
                onClick={signInWithGoogle}
              >
                Sign In with Google
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-poliscai-dark text-white py-8 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="font-serif text-lg mb-2">
            <span className="text-white">PoliSc</span><span className="text-poliscai-secondary">AI</span>
          </p>
          <p className="text-white/60 text-sm">
            Democracy V2.0 — Political Science + AI
          </p>
          <p className="text-white/40 text-xs mt-4">
            A civic project to surface what was always there in the shadow.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Home;

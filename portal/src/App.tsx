import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import {
  Compass,
  FileText,
  TrendingUp,
  Scale,
  LogOut,
  Loader2,
  ExternalLink,
} from 'lucide-react';

// Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

interface AppCard {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: React.ReactNode;
  gradient: string;
}

const apps: AppCard[] = [
  {
    id: 'agentqu',
    name: 'AgentQu',
    description: 'AI-powered activity discovery. Find things to do nearby based on your interests.',
    url: 'https://agentqu-platform.web.app',
    icon: <Compass className="w-8 h-8" />,
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'carried',
    name: 'Carried',
    description: 'Semantic memory bank for organizational decisions. Meeting minutes made searchable.',
    url: 'https://carried-app.web.app',
    icon: <FileText className="w-8 h-8" />,
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    id: 'stockwatch',
    name: 'Stock Watch',
    description: 'AI-powered stock analysis and portfolio tracking with real-time insights.',
    url: 'https://agentqu-platform.web.app/stocks',
    icon: <TrendingUp className="w-8 h-8" />,
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'poliscai',
    name: 'PolisCAI',
    description: 'AI-assisted constitutional analysis and civic document review.',
    url: 'https://poliscai-democracy.web.app',
    icon: <Scale className="w-8 h-8" />,
    gradient: 'from-amber-500 to-orange-500',
  },
];

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check for redirect result first
    getRedirectResult(auth)
      .then((result) => {
        if (result?.user) {
          console.log('PORTAL_DEBUG: Redirect sign-in successful');
        }
      })
      .catch((error) => {
        console.error('PORTAL_DEBUG: Redirect error:', error);
        setError('Sign-in failed. Please try again.');
      });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('PORTAL_DEBUG: Auth state changed:', user?.email || 'signed out');
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setSigningIn(true);
    setError(null);

    try {
      // Try popup first
      await signInWithPopup(auth, googleProvider);
      console.log('PORTAL_DEBUG: Popup sign-in successful');
    } catch (popupError: unknown) {
      console.error('PORTAL_DEBUG: Popup error:', popupError);

      // If popup blocked or failed, try redirect
      const errorCode = (popupError as { code?: string })?.code;
      if (errorCode === 'auth/popup-blocked' ||
          errorCode === 'auth/popup-closed-by-user' ||
          errorCode === 'auth/cancelled-popup-request') {
        console.log('PORTAL_DEBUG: Trying redirect sign-in...');
        try {
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectError) {
          console.error('PORTAL_DEBUG: Redirect error:', redirectError);
          setError('Sign-in failed. Please check your browser settings.');
        }
      } else if (errorCode === 'auth/unauthorized-domain') {
        setError('This domain is not authorized. Please contact the administrator.');
      } else {
        setError('Sign-in failed. Please try again.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('PORTAL_DEBUG: Sign out error:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="px-6 py-4 border-b border-slate-700/50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-white font-bold text-lg">N</span>
            </div>
            <span className="text-white font-semibold text-xl tracking-tight">Agent Nerd</span>
          </div>

          {user && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                {user.photoURL && (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-9 h-9 rounded-full ring-2 ring-slate-700"
                  />
                )}
                <span className="text-slate-300 text-sm hidden sm:block font-medium">
                  {user.displayName || user.email}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block text-sm">Sign out</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="px-6 py-12">
        <div className="max-w-6xl mx-auto">
          {!user ? (
            /* Login Screen */
            <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-8 shadow-2xl shadow-purple-500/30">
                <span className="text-white font-bold text-5xl">N</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
                Welcome to Agent Nerd
              </h1>
              <p className="text-slate-400 text-lg mb-10 max-w-md leading-relaxed">
                Your AI-powered app suite. Sign in to access all your apps.
              </p>

              {error && (
                <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm max-w-md">
                  {error}
                </div>
              )}

              <button
                onClick={handleSignIn}
                disabled={signingIn}
                className="flex items-center gap-3 px-8 py-4 bg-white text-slate-900 rounded-xl font-semibold text-lg hover:bg-slate-100 hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-black/20"
              >
                {signingIn ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Sign in with Google
                  </>
                )}
              </button>

              <p className="mt-8 text-slate-500 text-sm">
                Secure sign-in powered by Google
              </p>
            </div>
          ) : (
            /* Apps Grid */
            <>
              <div className="text-center mb-12">
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 tracking-tight">
                  Your Apps
                </h1>
                <p className="text-slate-400 text-lg">
                  Choose an app to get started
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {apps.map((appCard) => (
                  <a
                    key={appCard.id}
                    href={appCard.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 hover:border-slate-600 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="flex items-start gap-5">
                      <div
                        className={`w-16 h-16 rounded-xl bg-gradient-to-br ${appCard.gradient} flex items-center justify-center text-white flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                      >
                        {appCard.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h2 className="text-xl font-semibold text-white">
                            {appCard.name}
                          </h2>
                          <ExternalLink className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-colors" />
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                          {appCard.description}
                        </p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>

              {/* Footer */}
              <div className="mt-16 text-center">
                <p className="text-slate-500 text-sm">Built with AI by Agent Nerd</p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import Chatbot from './components/Chatbot';
import VoiceAssistant from './components/VoiceAssistant';
import HomePage from './components/HomePage';
import AboutPage from './components/AboutPage';
import FaqPage from './components/FaqPage';
import RiskAssessment from './components/RiskAssessment';
import AuthPage from './components/AuthPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import CookiePolicy from './components/CookiePolicy';
import UpgradeModal from './components/UpgradeModal';
import { BotIcon, HomeIcon, MicrophoneIcon, InfoIcon, QuestionIcon, ShieldIcon, MenuIcon, XIcon, LogOutIcon, UserIcon } from './components/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from './supabaseClient';
import { UserProfile } from './types';

export type View = 'home' | 'chat' | 'voice' | 'about' | 'faq' | 'risk' | 'privacy' | 'terms' | 'cookies';
export type Language = 'en' | 'sw' | 'luo';

const App: React.FC = () => {
  const [view, setView] = useState<View>('home');
  const [language, setLanguage] = useState<Language>(() => {
      const saved = localStorage.getItem('schisto_app_lang');
      return (saved as Language) || 'en';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Auth State
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);
  const [pendingView, setPendingView] = useState<View | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Initialize Supabase Auth & Profile
  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) fetchProfile(session.user.id, session.user.email);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email);
      } else {
        setUserProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, email?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (data) {
        setUserProfile(data);
      } else if (email) {
        // Fallback: Create profile if missing (Safety net)
        const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{ id: userId, email: email }])
            .select()
            .single();
            
        if (newProfile) setUserProfile(newProfile);
      }
    } catch (e) {
      console.error("Error fetching profile:", e);
    }
  };

  // Save language to localStorage whenever it changes
  useEffect(() => {
      localStorage.setItem('schisto_app_lang', language);
  }, [language]);

  const navItemClass = (active: boolean) => 
    `px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${
      active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : 'text-gray-500 hover:text-gray-800'
    }`;

  const mobileNavItemClass = (active: boolean) => 
    `flex items-center gap-4 w-full p-4 rounded-xl transition-all duration-300 font-bold ${
        active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
        : 'bg-white text-gray-600 border border-gray-50 hover:bg-gray-50'
    }`;

  const handleNavClick = (newView: View) => {
    if ((newView === 'chat' || newView === 'voice') && !session) {
        setPendingView(newView);
        setAuthMode('login');
        setIsMobileMenuOpen(false);
        return;
    }
    setView(newView);
    setIsMobileMenuOpen(false);
  };

  const handleLoginSuccess = () => {
      setAuthMode(null);
      if (pendingView) {
          setView(pendingView);
          setPendingView(null);
      }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsProfileMenuOpen(false);
    setView('home');
  };

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-gray-800 flex flex-col items-center p-0 md:p-6 font-sans">
      
      {/* Auth Modal */}
      <AnimatePresence>
        {authMode && (
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4"
            >
                <AuthPage 
                    mode={authMode}
                    onLoginSuccess={handleLoginSuccess} 
                    onClose={() => { setAuthMode(null); setPendingView(null); }} 
                    onSwitchMode={setAuthMode}
                />
            </motion.div>
        )}
      </AnimatePresence>

      {/* Upgrade Modal */}
      <AnimatePresence>
        {showUpgradeModal && (
          <UpgradeModal 
            user={userProfile}
            onClose={() => setShowUpgradeModal(false)}
            onUpgradeSuccess={() => {
              if (session?.user) fetchProfile(session.user.id, session.user.email);
            }}
          />
        )}
      </AnimatePresence>

      <div className="w-full max-w-6xl flex flex-col h-screen md:h-[92vh]">
        
        {/* Header */}
        <header className="flex flex-row justify-between items-center mb-0 md:mb-6 bg-white p-4 md:px-8 md:py-5 md:rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] shrink-0 z-30 relative">
          <div className="flex items-center gap-3 md:gap-4">
            <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 -ml-2 text-gray-600 rounded-xl hover:bg-gray-100"
            >
                <MenuIcon className="w-6 h-6" />
            </button>

            <motion.div 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 cursor-pointer" 
                onClick={() => handleNavClick('home')}
            >
                <div className="bg-gradient-to-tr from-blue-600 to-blue-400 p-2 md:p-2.5 rounded-xl shadow-blue-200 shadow-lg">
                  <BotIcon className="h-6 w-6 md:h-7 md:w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-lg md:text-2xl font-bold text-gray-800 tracking-tight">Schisto-Care</h1>
                  <p className="text-[10px] md:text-xs text-gray-400 font-medium hidden md:block tracking-wide">
                      AI Guidance & Prevention
                  </p>
                </div>
            </motion.div>
          </div>

          <div className="flex items-center gap-6">
             {/* Desktop Nav */}
             <nav className="hidden md:flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                <button onClick={() => handleNavClick('home')} className={navItemClass(view === 'home')}>Home</button>
                <button onClick={() => handleNavClick('risk')} className={navItemClass(view === 'risk')}>Risk Check</button>
                <button onClick={() => handleNavClick('chat')} className={navItemClass(view === 'chat')}>Chat</button>
                <button onClick={() => handleNavClick('voice')} className={navItemClass(view === 'voice')}>Voice</button>
             </nav>

            {/* Desktop Auth Status */}
            <div className="hidden md:block relative">
                {session ? (
                    <div className="relative">
                        <button 
                          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                          className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-xl transition-colors"
                        >
                            <div className="text-right hidden lg:block">
                              <p className="text-xs font-bold text-gray-700">{userProfile?.email?.split('@')[0]}</p>
                              <p className="text-[10px] text-blue-500 font-medium">
                                {userProfile?.is_premium ? 'Premium Member' : `${userProfile?.prompt_count || 0}/15 Prompts`}
                              </p>
                            </div>
                            <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-white font-bold text-xs shadow-sm ${userProfile?.is_premium ? 'bg-gradient-to-tr from-amber-400 to-orange-500 border-orange-200' : 'bg-blue-500 border-blue-200'}`}>
                                {userProfile?.email?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        </button>

                        {/* Profile Dropdown */}
                        <AnimatePresence>
                          {isProfileMenuOpen && (
                            <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 z-50"
                            >
                              <div className="mb-4 pb-4 border-b border-gray-100">
                                <p className="text-sm font-bold text-gray-800">Account Status</p>
                                <div className="flex items-center justify-between mt-2">
                                  <span className="text-xs text-gray-500">Plan</span>
                                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${userProfile?.is_premium ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'}`}>
                                    {userProfile?.is_premium ? 'Premium' : 'Free Trial'}
                                  </span>
                                </div>
                                {!userProfile?.is_premium && (
                                  <div className="mt-3">
                                    <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                      <span>Usage</span>
                                      <span>{userProfile?.prompt_count}/15</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${Math.min(((userProfile?.prompt_count || 0) / 15) * 100, 100)}%` }}></div>
                                    </div>
                                    <button 
                                      onClick={() => { setShowUpgradeModal(true); setIsProfileMenuOpen(false); }}
                                      className="w-full mt-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-lg transition-all"
                                    >
                                      Upgrade Now
                                    </button>
                                  </div>
                                )}
                              </div>
                              <button
                                  onClick={handleLogout}
                                  className="w-full flex items-center gap-2 p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                              >
                                  <LogOutIcon className="w-4 h-4" />
                                  Sign Out
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                      <button 
                          onClick={() => setAuthMode('login')} 
                          className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors"
                      >
                          Log In
                      </button>
                      <button 
                          onClick={() => setAuthMode('signup')} 
                          className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-xl shadow-md shadow-blue-200 hover:bg-blue-700 transition-colors"
                      >
                          Sign Up
                      </button>
                    </div>
                )}
            </div>
          </div>
        </header>

        {/* Mobile Sidebar */}
        <AnimatePresence>
            {isMobileMenuOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                    />
                    <motion.div 
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        className="fixed top-0 left-0 bottom-0 w-[280px] bg-[#F8FAFC] z-50 md:hidden shadow-2xl flex flex-col p-6"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">Menu</h2>
                            <button 
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="p-2 bg-white rounded-full shadow-sm border border-gray-100 text-gray-500"
                            >
                                <XIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {session && (
                          <div className="mb-6 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-3 mb-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${userProfile?.is_premium ? 'bg-orange-500' : 'bg-blue-500'}`}>
                                {userProfile?.email?.charAt(0).toUpperCase()}
                              </div>
                              <div className="overflow-hidden">
                                <p className="font-bold text-gray-800 text-sm truncate">{userProfile?.email}</p>
                                <p className="text-xs text-gray-400">{userProfile?.is_premium ? 'Premium' : 'Free Plan'}</p>
                              </div>
                            </div>
                            {!userProfile?.is_premium && (
                              <button 
                                onClick={() => { setShowUpgradeModal(true); setIsMobileMenuOpen(false); }}
                                className="w-full py-2 bg-blue-600 text-white text-xs font-bold rounded-lg"
                              >
                                Upgrade to Premium
                              </button>
                            )}
                          </div>
                        )}

                        <div className="flex flex-col gap-3 overflow-y-auto">
                            <button onClick={() => handleNavClick('home')} className={mobileNavItemClass(view === 'home')}>
                                <HomeIcon className="w-5 h-5" /> Home
                            </button>
                            <button onClick={() => handleNavClick('risk')} className={mobileNavItemClass(view === 'risk')}>
                                <ShieldIcon className="w-5 h-5" /> Risk Check
                            </button>
                            <button onClick={() => handleNavClick('chat')} className={mobileNavItemClass(view === 'chat')}>
                                <BotIcon className="w-5 h-5" /> Chat
                            </button>
                            <button onClick={() => handleNavClick('voice')} className={mobileNavItemClass(view === 'voice')}>
                                <MicrophoneIcon className="w-5 h-5" /> Voice
                            </button>
                        </div>
                        
                        <div className="mt-auto pt-4 border-t border-gray-200">
                            {session ? (
                                <button onClick={handleLogout} className="w-full py-3 flex items-center justify-center gap-2 text-red-500 font-bold text-sm bg-red-50 rounded-xl">
                                    <LogOutIcon className="w-4 h-4" /> Log Out
                                </button>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                  <button onClick={() => { setIsMobileMenuOpen(false); setAuthMode('login'); }} className="py-3 text-gray-600 font-bold text-sm bg-white border border-gray-200 rounded-xl">
                                      Log In
                                  </button>
                                  <button onClick={() => { setIsMobileMenuOpen(false); setAuthMode('signup'); }} className="py-3 text-white font-bold text-sm bg-blue-600 rounded-xl">
                                      Sign Up
                                  </button>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>

        <main className="flex-grow bg-white md:bg-transparent overflow-hidden flex flex-col relative h-full">
          <div className="h-full w-full md:bg-white md:rounded-3xl md:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] md:border md:border-white/50 overflow-hidden relative">
            {view === 'home' && <HomePage language={language} onNavigate={handleNavClick} />}
            {view === 'risk' && <RiskAssessment language={language} />}
            {view === 'chat' && <Chatbot language={language} user={userProfile} onUpgrade={() => setShowUpgradeModal(true)} onUsageUpdate={() => session?.user && fetchProfile(session.user.id, session.user.email)} />}
            {view === 'voice' && <VoiceAssistant language={language} />}
            {view === 'about' && <AboutPage language={language} />}
            {view === 'faq' && <FaqPage language={language} />}
            {view === 'privacy' && <PrivacyPolicy language={language} onNavigate={handleNavClick} />}
            {view === 'terms' && <TermsOfService language={language} onNavigate={handleNavClick} />}
            {view === 'cookies' && <CookiePolicy language={language} onNavigate={handleNavClick} />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;

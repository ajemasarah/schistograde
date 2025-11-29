import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BotIcon, XIcon, EyeIcon, EyeOffIcon } from './icons';
import { supabase } from '../supabaseClient';

interface AuthPageProps {
  mode: 'login' | 'signup';
  onLoginSuccess: () => void;
  onClose: () => void;
  onSwitchMode: (mode: 'login' | 'signup') => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ mode, onLoginSuccess, onClose, onSwitchMode }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (signUpError) throw signUpError;
        
        // Auto login after signup or show message
        onLoginSuccess();
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        
        onLoginSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md relative">
       {/* Close Button */}
       <button 
        onClick={onClose}
        className="absolute -top-12 right-0 md:-right-12 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50 backdrop-blur-md"
      >
        <XIcon className="w-6 h-6" />
      </button>

      {/* Logo Section */}
      <motion.div 
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-8"
      >
          <div className="inline-block p-4 bg-white rounded-2xl shadow-xl shadow-blue-100 mb-4">
              <BotIcon className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight drop-shadow-md">Schisto-Care</h1>
          <p className="text-blue-100 text-sm font-medium">AI-Powered Health Assistant</p>
      </motion.div>

      <motion.div 
          layout
          className="bg-white rounded-3xl shadow-2xl overflow-hidden relative p-8"
      >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                  <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Full Name</label>
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
                        placeholder="John Doe" 
                        required 
                      />
                  </div>
              )}
              
              <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 transition-all" 
                    placeholder="you@example.com" 
                    required 
                  />
              </div>

              <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-100 transition-all pr-12" 
                        placeholder="••••••••" 
                        required 
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600"
                    >
                        {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                    </button>
                  </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-500 text-sm rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              {mode === 'signup' && (
                  <div className="text-xs text-gray-400 leading-tight">
                      By signing up, you agree to our Terms of Service regarding medical data privacy.
                  </div>
              )}

              <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200 mt-4 hover:bg-blue-700 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                  {loading ? 'Processing...' : (mode === 'login' ? 'Log In' : 'Sign Up')}
              </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
              <button 
                onClick={() => onSwitchMode(mode === 'login' ? 'signup' : 'login')}
                className="ml-2 text-blue-600 font-bold hover:underline"
              >
                {mode === 'login' ? 'Sign Up' : 'Log In'}
              </button>
            </p>
          </div>
          
          {/* Soft UI Decoration */}
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-32 h-32 bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-32 h-32 bg-purple-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10 pointer-events-none"></div>
      </motion.div>
    </div>
  );
};

export default AuthPage;

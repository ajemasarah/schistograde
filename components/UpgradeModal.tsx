import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, ShieldIcon, BotIcon } from './icons';
import { supabase } from '../supabaseClient';
import { UserProfile } from '../types';

interface UpgradeModalProps {
  onClose: () => void;
  onUpgradeSuccess: () => void;
  user: UserProfile | null;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ onClose, onUpgradeSuccess, user }) => {
  const [processing, setProcessing] = useState<string | null>(null);

  const handleUpgrade = async (plan: 'monthly' | 'biweekly') => {
    if (!user) return;
    
    setProcessing(plan);
    
    // Simulate payment processing delay
    setTimeout(async () => {
      try {
        // In a real app, you would verify payment here before updating DB
        const { error } = await supabase
          .from('profiles')
          .update({ 
            is_premium: true,
            subscription_plan: plan 
          })
          .eq('id', user.id);

        if (error) throw error;
        
        onUpgradeSuccess();
        onClose();
      } catch (err) {
        console.error('Upgrade failed:', err);
        setProcessing(null);
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-gray-900/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors z-20"
        >
          <XIcon className="w-5 h-5 text-gray-500" />
        </button>

        <div className="flex flex-col md:flex-row">
          {/* Left Side - Value Prop */}
          <div className="bg-gradient-to-br from-blue-600 to-purple-700 p-8 text-white md:w-2/5 flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div>
              <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-6 backdrop-blur-md">
                <ShieldIcon className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Upgrade to Premium</h2>
              <p className="text-blue-100 text-sm leading-relaxed mb-6">
                Unlock the full potential of Schisto-Care Assistant and get unlimited access to AI health analysis.
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-400/20 flex items-center justify-center text-green-300">✓</div>
                  Unlimited Chat Prompts
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-400/20 flex items-center justify-center text-green-300">✓</div>
                  Advanced Snail Analysis
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-green-400/20 flex items-center justify-center text-green-300">✓</div>
                  Priority Support
                </li>
              </ul>
            </div>
            <div className="mt-8 text-xs text-blue-200 opacity-80">
              Secure payment via Stripe (Mock)
            </div>
          </div>

          {/* Right Side - Plans */}
          <div className="p-8 md:w-3/5 bg-white">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Choose your plan</h3>
            
            <div className="space-y-4">
              {/* Plan 1 */}
              <div 
                onClick={() => handleUpgrade('monthly')}
                className="group relative border-2 border-blue-100 hover:border-blue-500 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-lg hover:shadow-blue-50"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-800">Monthly Access</h4>
                    <p className="text-xs text-gray-500">Billed every month</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-bold text-blue-600">$3.00</span>
                    <span className="text-xs text-gray-400">/ month</span>
                  </div>
                </div>
                {processing === 'monthly' && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Plan 2 */}
              <div 
                onClick={() => handleUpgrade('biweekly')}
                className="group relative border-2 border-purple-100 hover:border-purple-500 rounded-2xl p-4 cursor-pointer transition-all hover:shadow-lg hover:shadow-purple-50"
              >
                <div className="absolute -top-3 right-4 bg-purple-500 text-white text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                  Flexible
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-bold text-gray-800">Bi-Weekly Access</h4>
                    <p className="text-xs text-gray-500">Billed every 2 weeks</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-bold text-purple-600">$1.00</span>
                    <span className="text-xs text-gray-400">/ 2 weeks</span>
                  </div>
                </div>
                {processing === 'biweekly' && (
                  <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                    <div className="w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 text-center">
              <p className="text-xs text-gray-400 mb-2">
                Current Status: <span className="font-bold text-gray-600">{user?.prompt_count || 0}/15 Free Prompts Used</span>
              </p>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-blue-500 h-full transition-all duration-500" 
                  style={{ width: `${Math.min(((user?.prompt_count || 0) / 15) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default UpgradeModal;

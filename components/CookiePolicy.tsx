import React from 'react';
import { Language, View } from '../App';
import Footer from './Footer';
import { motion } from 'framer-motion';
import { EyeIcon } from './icons';

interface CookiePolicyProps {
    language: Language;
    onNavigate: (view: View) => void;
}

const CookiePolicy: React.FC<CookiePolicyProps> = ({ language, onNavigate }) => {
    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex flex-col h-full overflow-y-auto bg-[#F8FAFC] text-gray-800"
        >
            <div className="max-w-4xl mx-auto p-8 md:p-12 w-full flex-grow">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="bg-purple-100 p-3 rounded-2xl">
                        <EyeIcon className="w-8 h-8 text-purple-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Cookie Policy</h1>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-gray-800 mb-3">1. What Are Cookies?</h2>
                        <p className="text-gray-600 leading-relaxed text-sm">
                            Cookies are small text files that are used to store small pieces of information. They are stored on your device when the website is loaded on your browser. These cookies help us make the website function properly, make it more secure, provide better user experience, and understand how the website performs.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-800 mb-3">2. How We Use Them</h2>
                        <p className="text-gray-600 leading-relaxed text-sm">
                            Schisto-Care uses "Local Storage" (a technology similar to cookies) primarily for essential functions:
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li><strong>Preferences:</strong> We store your selected language (English, Kiswahili, or Luo) so you don't have to switch it every time you visit.</li>
                                <li><strong>History:</strong> We store your chat history locally on your device so you can view past conversations.</li>
                                <li><strong>Authentication:</strong> If you log in, we store a session token to keep you logged in.</li>
                            </ul>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-800 mb-3">3. Managing Your Data</h2>
                        <p className="text-gray-600 leading-relaxed text-sm">
                            Since we use Local Storage for these features, clearing your browser's cache or data for this site will remove your saved chat history and reset your language preference. You can do this at any time through your browser settings.
                        </p>
                    </section>
                </div>
            </div>
            <Footer language={language} onNavigate={onNavigate} />
        </motion.div>
    );
};

export default CookiePolicy;

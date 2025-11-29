import React from 'react';
import { Language, View } from '../App';
import Footer from './Footer';
import { motion } from 'framer-motion';
import { ShieldIcon } from './icons';

interface PrivacyPolicyProps {
    language: Language;
    onNavigate: (view: View) => void;
}

const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ language, onNavigate }) => {
    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="flex flex-col h-full overflow-y-auto bg-[#F8FAFC] text-gray-800"
        >
            <div className="max-w-4xl mx-auto p-8 md:p-12 w-full flex-grow">
                <div className="flex items-center gap-4 mb-8">
                    <div className="bg-green-100 p-3 rounded-2xl">
                        <ShieldIcon className="w-8 h-8 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
                </div>

                <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-8">
                    <section>
                        <h2 className="text-xl font-bold text-gray-800 mb-3">1. Information We Collect</h2>
                        <p className="text-gray-600 leading-relaxed text-sm">
                            We collect information you provide directly to us when you use the Schisto-Care Assistant. This includes:
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Health-related symptoms and queries you input into the Chat or Voice Assistant.</li>
                                <li>Geographic location data if you enable the Risk Assessment feature.</li>
                                <li>Images uploaded for analysis (e.g., snail images).</li>
                            </ul>
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-800 mb-3">2. How We Use Your Information</h2>
                        <p className="text-gray-600 leading-relaxed text-sm">
                            We use the information we collect to:
                            <ul className="list-disc pl-5 mt-2 space-y-1">
                                <li>Provide, maintain, and improve the Schisto-Care services.</li>
                                <li>Generate AI-powered responses to your health queries.</li>
                                <li>Estimate infection risk based on environmental factors.</li>
                            </ul>
                            We do not sell your personal data to third parties.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-800 mb-3">3. Data Storage & AI Processing</h2>
                        <p className="text-gray-600 leading-relaxed text-sm">
                            Your chat history is stored locally on your device for your convenience. However, queries sent to the AI (Google Gemini) are processed in the cloud. We advise against sharing personally identifiable information (such as your full name or ID number) in the chat.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-800 mb-3">4. Your Rights</h2>
                        <p className="text-gray-600 leading-relaxed text-sm">
                            You have the right to access, correct, or delete your personal data stored within the app. You can clear your chat history at any time using the delete function in the sidebar.
                        </p>
                    </section>
                </div>
            </div>
            <Footer language={language} onNavigate={onNavigate} />
        </motion.div>
    );
};

export default PrivacyPolicy;

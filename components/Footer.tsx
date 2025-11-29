import React from 'react';
import { BotIcon } from './icons';
import { Language, View } from '../App';

interface FooterProps {
    language: Language;
    onNavigate: (view: View) => void;
}

const Footer: React.FC<FooterProps> = ({ language, onNavigate }) => {
    
    const getContent = () => {
        if (language === 'sw') {
            return {
                prefooterTitle: "Jiunge na mapambano dhidi ya Kichocho.",
                prefooterDesc: "Pata habari za hivi punde, vidokezo vya afya, na arifa za maeneo hatari moja kwa moja kwenye kikasha chako.",
                subscribe: "Jiandikishe",
                links: "Viungo",
                legal: "Kisheria",
                contact: "Wasiliana",
                about: "Kuhusu Sisi",
                privacy: "Faragha",
                terms: "Masharti",
                rights: "Haki zote zimehifadhiwa."
            };
        } else if (language === 'luo') {
            return {
                prefooterTitle: "Riwwa lwedo e kedo gi Tuo Kichocho.",
                prefooterDesc: "Yud weche manyien, puonj mag ngima, kod ranyisi mag kuonde ma masira nitie.",
                subscribe: "Ndikri",
                links: "Weche",
                legal: "Chike",
                contact: "Tudruok",
                about: "E Wiwa",
                privacy: "Siri",
                terms: "Chike",
                rights: "Weche duto oting'.",
            };
        }
        return {
            prefooterTitle: "Join the fight against Schistosomiasis.",
            prefooterDesc: "Get the latest updates, health tips, and hotspot alerts delivered directly to your inbox.",
            subscribe: "Subscribe",
            links: "Links",
            legal: "Legal",
            contact: "Contact",
            about: "About Us",
            privacy: "Privacy Policy",
            terms: "Terms of Service",
            rights: "All rights reserved."
        };
    };

    const content = getContent();

    return (
        <div className="mt-12 w-full">
            {/* Pre-Footer / CTA */}
            <div className="relative overflow-hidden bg-gray-900 rounded-3xl p-8 md:p-12 mb-12 mx-6 text-center md:text-left">
                 {/* Decorative Blobs */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-600 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                    <div className="max-w-xl">
                        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
                            {content.prefooterTitle}
                        </h2>
                        <p className="text-gray-400">
                            {content.prefooterDesc}
                        </p>
                    </div>
                    <div className="flex w-full md:w-auto flex-col sm:flex-row gap-3">
                        <input 
                            type="email" 
                            placeholder="email@example.com" 
                            className="px-6 py-4 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 backdrop-blur-sm"
                        />
                        <button className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors shadow-lg shadow-blue-900/50">
                            {content.subscribe}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Footer */}
            <footer className="bg-white border-t border-gray-100 pt-16 pb-8 px-8 rounded-t-3xl md:rounded-3xl shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.03)] mx-0 md:mx-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-1">
                        <div className="flex items-center gap-2 mb-4">
                            <BotIcon className="w-6 h-6 text-blue-600" />
                            <span className="font-bold text-gray-800 text-lg">Schisto-Care</span>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Empowering communities with AI-driven health insights to prevent and treat Schistosomiasis.
                        </p>
                    </div>
                    
                    <div>
                        <h4 className="font-bold text-gray-800 mb-4">{content.links}</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><button onClick={() => onNavigate('home')} className="hover:text-blue-600 transition-colors">Home</button></li>
                            <li><button onClick={() => onNavigate('risk')} className="hover:text-blue-600 transition-colors">Risk Check</button></li>
                            <li><button onClick={() => onNavigate('chat')} className="hover:text-blue-600 transition-colors">Chat Assistant</button></li>
                            <li><button onClick={() => onNavigate('about')} className="hover:text-blue-600 transition-colors">{content.about}</button></li>
                        </ul>
                    </div>

                    <div>
                         <h4 className="font-bold text-gray-800 mb-4">{content.legal}</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li><button onClick={() => onNavigate('privacy')} className="hover:text-blue-600 transition-colors">{content.privacy}</button></li>
                            <li><button onClick={() => onNavigate('terms')} className="hover:text-blue-600 transition-colors">{content.terms}</button></li>
                            <li><button onClick={() => onNavigate('cookies')} className="hover:text-blue-600 transition-colors">Cookie Policy</button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-800 mb-4">{content.contact}</h4>
                        <ul className="space-y-2 text-sm text-gray-500">
                            <li>support@schistocare.org</li>
                            <li>+254 700 000 000</li>
                            <li>Nairobi, Kenya</li>
                        </ul>
                    </div>
                </div>
                
                <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-400">
                    <p>&copy; 2024 Schisto-Care. {content.rights}</p>
                    <div className="flex gap-4">
                         {/* Social placeholders */}
                         <div className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"></div>
                         <div className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"></div>
                         <div className="w-8 h-8 rounded-full bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"></div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Footer;

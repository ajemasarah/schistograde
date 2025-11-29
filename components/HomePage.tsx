import React from 'react';
import { BotIcon, MicrophoneIcon, ShieldIcon } from './icons';
import { Language, View } from '../App';
import { motion, Variants } from 'framer-motion';
import Footer from './Footer';

interface HomePageProps {
  language: Language;
  onNavigate: (view: View) => void;
}

const HomePage: React.FC<HomePageProps> = ({ language, onNavigate }) => {
  
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 30 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 50,
        damping: 15
      }
    }
  };

  const cardVariants: Variants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: "spring", stiffness: 50 } 
    },
    hover: { 
      y: -8, 
      transition: { type: "spring", stiffness: 300, damping: 20 } 
    }
  };

  const getText = () => {
    if (language === 'sw') {
        return {
            welcome: "Karibu Schisto-Care",
            intro: "Msaidizi wako mahiri wa kugundua na kuzuia Kichocho. Inaendeshwa na AI ya hali ya juu kukuongoza kuelekea afya bora.",
            cardRiskTitle: "Angalia Hatari",
            cardRiskDesc: "Tathmini mazingira na dalili zako. Inajumuisha Kamera ya Konokono ya AI.",
            start: "Anza",
            cardChatTitle: "Msaidizi wa Chat",
            cardChatDesc: "Uliza maswali na pakia nyaraka kwa uchambuzi.",
            chatNow: "Chat Sasa",
            cardVoiceTitle: "Msaidizi wa Sauti",
            cardVoiceDesc: "Ongea moja kwa moja na AI yetu.",
            speak: "Ongea",
            aboutTitle: "Kuhusu Kichocho",
            whatIsTitle: "Ni nini?",
            whatIsDesc: "Ugonjwa unaosababishwa na minyoo wa kichocho.",
            transTitle: "Maambukizi",
            transDesc: "Kuwasiliana na maji safi yaliyoambukizwa na vimelea.",
            prevTitle: "Kinga",
            prevDesc: "Epuka kuogelea kwenye maji safi, kunywa maji salama."
        };
    } else if (language === 'luo') {
        return {
            welcome: "Amosi e Schisto-Care",
            intro: "Jakony mari ma tiyo gi AI e fwenyo kod geng'o tuo mar Kichocho. Watiyo gi teknoloji manyien mar AI e tayi ne ngima maber.",
            cardRiskTitle: "Pim Masira",
            cardRiskDesc: "Non aluorami kod ranyisi mag tuo. Oting'o 'Kamera mar Kamongo' mar AI.",
            start: "Chak",
            cardChatTitle: "Japuochni (Chat)",
            cardChatDesc: "Penj penjo kendo ior picha mag weche thieth mondo wanoni.",
            chatNow: "Wuoyo Sani",
            cardVoiceTitle: "Japuochni mar Dwol",
            cardVoiceDesc: "Wuoyo direct kod AI marwa mondo ikonyri piyo.",
            speak: "Wuo",
            aboutTitle: "E Wi Kichocho",
            whatIsTitle: "En Ang'o?",
            whatIsDesc: "En tuo ma njokni kelo (schistosomes).",
            transTitle: "Kaka iyude",
            transDesc: "Ka dendi ogudo pi man gi njokni go.",
            prevTitle: "Geng'o",
            prevDesc: "Kik igud pi ma ok ler, madh pi motwe."
        };
    }
    return {
        welcome: "Welcome to Schisto-Care",
        intro: "Your intelligent assistant for detecting and preventing Schistosomiasis. Powered by advanced AI to guide you towards better health.",
        cardRiskTitle: "Check Risk Level",
        cardRiskDesc: "Evaluate your environment and symptoms. AI Snail Cam included.",
        start: "Start Check",
        cardChatTitle: "Chat Assistant",
        cardChatDesc: "Ask questions & upload documents for analysis.",
        chatNow: "Chat Now",
        cardVoiceTitle: "Voice Assistant",
        cardVoiceDesc: "Talk directly to our AI for quick advice.",
        speak: "Speak",
        aboutTitle: "About Schistosomiasis",
        whatIsTitle: "What is it?",
        whatIsDesc: "A disease caused by parasitic flatworms called schistosomes.",
        transTitle: "Transmission",
        transDesc: "Contact with contaminated freshwater containing the parasites.",
        prevTitle: "Prevention",
        prevDesc: "Avoid swimming in fresh water, drink safe water, improve sanitation."
    };
  };

  const t = getText();

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col h-full overflow-y-auto bg-[#F0F2F5] md:bg-white text-gray-800 scrollbar-hide"
    >
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-white p-8 md:p-16 text-center rounded-b-[3rem] md:rounded-none mb-6">
        {/* Decorational Blurs */}
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

        <motion.div variants={itemVariants} className="relative z-10 flex justify-center mb-8">
            <div className="bg-gradient-to-tr from-blue-600 to-blue-400 p-6 rounded-3xl shadow-xl shadow-blue-200">
                 <BotIcon className="w-20 h-20 text-white" />
            </div>
        </motion.div>
        
        <motion.h1 variants={itemVariants} className="relative z-10 text-4xl md:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
          {t.welcome}
        </motion.h1>
        
        <motion.p variants={itemVariants} className="relative z-10 text-lg md:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          {t.intro}
        </motion.p>
      </div>

      {/* Feature Cards */}
      <div className="max-w-5xl mx-auto px-6 w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {/* Risk Assessment Card */}
        <motion.div 
            variants={cardVariants}
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('risk')}
            className="group bg-white rounded-3xl p-8 cursor-pointer shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-50 relative overflow-hidden"
        >
           <div className="absolute top-0 right-0 w-32 h-32 bg-orange-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700 ease-in-out"></div>
           <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-orange-50 p-4 rounded-2xl group-hover:bg-orange-500 transition-colors duration-300">
                    <ShieldIcon className="w-8 h-8 text-orange-500 group-hover:text-white transition-colors duration-300" />
                    </div>
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-3">
                    {t.cardRiskTitle}
                </h2>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                    {t.cardRiskDesc}
                </p>
                <div className="flex items-center text-orange-500 font-bold text-sm group-hover:translate-x-2 transition-transform duration-300">
                    {t.start} 
                    <span className="ml-2">→</span>
                </div>
           </div>
        </motion.div>

        {/* Chat Card */}
        <motion.div 
            variants={cardVariants}
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('chat')}
            className="group bg-white rounded-3xl p-8 cursor-pointer shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-50 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700 ease-in-out"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-2xl group-hover:bg-blue-600 transition-colors duration-300">
                <BotIcon className="w-8 h-8 text-blue-600 group-hover:text-white transition-colors duration-300" />
                </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">
                {t.cardChatTitle}
            </h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                {t.cardChatDesc}
            </p>
            <div className="flex items-center text-blue-600 font-bold text-sm group-hover:translate-x-2 transition-transform duration-300">
                {t.chatNow} 
                <span className="ml-2">→</span>
            </div>
          </div>
        </motion.div>

        {/* Voice Card */}
        <motion.div 
            variants={cardVariants}
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            onClick={() => onNavigate('voice')}
            className="group bg-white rounded-3xl p-8 cursor-pointer shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-gray-50 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700 ease-in-out"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-2xl group-hover:bg-green-600 transition-colors duration-300">
                <MicrophoneIcon className="w-8 h-8 text-green-600 group-hover:text-white transition-colors duration-300" />
                </div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-3">
                {t.cardVoiceTitle}
            </h2>
            <p className="text-gray-500 text-sm mb-6 leading-relaxed">
                {t.cardVoiceDesc}
            </p>
            <div className="flex items-center text-green-600 font-bold text-sm group-hover:translate-x-2 transition-transform duration-300">
                {t.speak}
                <span className="ml-2">→</span>
            </div>
          </div>
        </motion.div>
      </div>

       {/* Info Section */}
       <motion.div variants={itemVariants} className="px-6 pb-12 w-full max-w-5xl mx-auto">
            <div className="bg-white rounded-3xl p-8 md:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-50">
                <h3 className="text-2xl font-bold text-gray-800 mb-8 text-center">
                    {t.aboutTitle}
                </h3>
                <div className="grid md:grid-cols-3 gap-8 text-sm text-gray-600">
                    <div className="bg-[#F8FAFC] p-6 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300">
                        <h4 className="font-bold text-blue-600 mb-3 text-lg">{t.whatIsTitle}</h4>
                        <p>{t.whatIsDesc}</p>
                    </div>
                     <div className="bg-[#F8FAFC] p-6 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300">
                        <h4 className="font-bold text-blue-600 mb-3 text-lg">{t.transTitle}</h4>
                        <p>{t.transDesc}</p>
                    </div>
                     <div className="bg-[#F8FAFC] p-6 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300">
                        <h4 className="font-bold text-blue-600 mb-3 text-lg">{t.prevTitle}</h4>
                        <p>{t.prevDesc}</p>
                    </div>
                </div>
            </div>
       </motion.div>
       
       {/* Footer Integration */}
       <Footer language={language} onNavigate={onNavigate} />

    </motion.div>
  );
};

export default HomePage;

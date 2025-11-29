import React, { useState } from 'react';
import { Language } from '../App';
import { ChevronDownIcon, ChevronUpIcon, QuestionIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';

interface FaqPageProps {
  language: Language;
}

const FaqPage: React.FC<FaqPageProps> = ({ language }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      question: {
        en: "What is Schistosomiasis?",
        sw: "Kichocho (Schistosomiasis) ni nini?",
        luo: "Tuo mar Kichocho (Schistosomiasis) en ang'o?"
      },
      answer: {
        en: "Schistosomiasis, also known as bilharzia, is a disease caused by parasitic flatworms called schistosomes. The urinary tract or the intestines may be infected. Symptoms include abdominal pain, diarrhea, bloody stool, or blood in the urine.",
        sw: "Kichocho, kinachojulikana pia kama kichocho, ni ugonjwa unaosababishwa na minyoo wa vimelea wanaoitwa schistosomes. Njia ya mkojo au matumbo inaweza kuambukizwa. Dalili ni pamoja na maumivu ya tumbo, kuhara, choo cha damu, au damu kwenye mkojo.",
        luo: "Kichocho, ma bende iluongo ni Bilharzia, en tuo ma njokni matindo tindo ma ok ne kelo. Onyalo hinyo lach kata ich. Ranyisi gin ich ma lit, diep, diep man gi remo, kata lach man gi remo."
      }
    },
    {
      question: {
        en: "How do I get infected?",
        sw: "Ninapataje maambukizi?",
        luo: "Anyalo yudo tuo ni nade?"
      },
      answer: {
        en: "Infection occurs when skin comes in contact with contaminated freshwater in which certain types of snails that carry schistosomes are living. Swimming, bathing, or washing clothes in such water puts you at risk.",
        sw: "Maambukizi hutokea wakati ngozi inapogusana na maji safi yaliyoambukizwa ambayo aina fulani za konokono wanaobeba schistosomes wanaishi. Kuogelea, kuoga, au kufua nguo katika maji kama hayo kunakuweka hatarini.",
        luo: "Iyude ka dhendi ogudo pi man gi njokni mag kamongo. Kuwang', luokruok, kata lwoko law e pi ma kamongo nitie miyi bedo e masira."
      }
    },
    {
      question: {
        en: "Can the AI diagnose me?",
        sw: "Je, AI inaweza kunitambua?",
        luo: "AI nyalo nona kendo pima?"
      },
      answer: {
        en: "No. The AI can analyze symptoms you describe or documents you upload to suggest possibilities, but it cannot perform lab tests. You must visit a clinic for a stool, urine, or blood test to get a confirmed diagnosis.",
        sw: "Hapana. AI inaweza kuchambua dalili unazoelezea au nyaraka unazopakia ili kupendekeza uwezekano, lakini haiwezi kufanya vipimo vya maabara. Lazima utembelee kliniki kwa kipimo cha choo, mkojo, au damu ili kupata utambuzi uliothibitishwa.",
        luo: "Ooyo. AI nyalo mana winjo ranyisi mari kata somo weche ma ioro, to ok onyal pimi. Nyaka idhi e ospital mondo opim lach kata cieth eka ing'e ka intie gi tuo."
      }
    },
    {
      question: {
        en: "How do I use the Document Store?",
        sw: "Ninatumiaje Hifadhi ya Nyaraka?",
        luo: "Atiyo nade gi Kano mar Ndiko?"
      },
      answer: {
        en: "In the Chat section, click the paperclip icon (Attachment). You can upload photos of medical reports or text files. The AI will read them and you can ask questions about the content.",
        sw: "Katika sehemu ya Chat, bonyeza ikoni ya klipu ya karatasi (Kiambatisho). Unaweza kupakia picha za ripoti za matibabu au faili za maandishi. AI itazisoma na unaweza kuuliza maswali kuhusu maudhui.",
        luo: "E site mar Chat, di 'Attachment' (ikoni mar paperclip). Inyalo oro picha mag weche thieth kata ndiko. AI biro somogi kendo inyalo penje penjo."
      }
    },
    {
      question: {
        en: "Is this service free?",
        sw: "Je, huduma hii ni bure?",
        luo: "Konyruok ni en nono?"
      },
      answer: {
        en: "Yes, Schisto-Care Assistant is a free tool designed to improve health awareness.",
        sw: "Ndiyo, Msaidizi wa Schisto-Care ni chombo cha bure kilichoundwa kuboresha uelewa wa afya.",
        luo: "Ee, Schisto-Care en nono, kendo olos mondo okony ji ng'eyo weche ngima."
      }
    }
  ];

  const getTitle = () => {
      if(language === 'sw') return 'Maswali Yanayoulizwa Mara kwa Mara';
      if(language === 'luo') return 'Penjo Mapile';
      return 'Frequently Asked Questions';
  };

  const getSubtitle = () => {
      if(language === 'sw') return 'Pata majibu ya wasiwasi wa kawaida.';
      if(language === 'luo') return 'Yud dwoko mag penjo.';
      return 'Find answers to common concerns.';
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto bg-[#F8FAFC] text-gray-800 p-4 md:p-8">
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-5 mb-10">
            <div className="bg-purple-600 p-4 rounded-2xl shadow-xl shadow-purple-200">
                <QuestionIcon className="w-8 h-8 text-white" />
            </div>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {getTitle()}
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    {getSubtitle()}
                </p>
            </div>
        </div>

        <div className="space-y-4">
            {faqs.map((faq, index) => (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    key={index} 
                    className={`bg-white rounded-2xl border transition-all duration-300 ${openIndex === index ? 'border-purple-200 shadow-lg shadow-purple-50' : 'border-gray-100 hover:border-purple-200'}`}
                >
                    <button 
                        onClick={() => toggleFaq(index)}
                        className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
                    >
                        <span className={`font-semibold text-lg ${openIndex === index ? 'text-purple-600' : 'text-gray-700'}`}>
                            {language === 'en' ? faq.question.en : (language === 'sw' ? faq.question.sw : faq.question.luo)}
                        </span>
                        {openIndex === index ? (
                            <ChevronUpIcon className="w-5 h-5 text-purple-500" />
                        ) : (
                            <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                        )}
                    </button>
                    
                    <AnimatePresence>
                    {openIndex === index && (
                        <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                        >
                            <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                                {language === 'en' ? faq.answer.en : (language === 'sw' ? faq.answer.sw : faq.answer.luo)}
                            </div>
                        </motion.div>
                    )}
                    </AnimatePresence>
                </motion.div>
            ))}
        </div>

        <div className="mt-12 p-8 bg-white rounded-3xl text-center border border-gray-50 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.05)]">
            <p className="text-gray-500 mb-4 font-medium">
                {language === 'en' ? "Still have questions?" : (language === 'sw' ? "Bado una maswali?" : "Ipod in gi penjo?")}
            </p>
            <button className="bg-gray-100 text-gray-400 px-6 py-3 rounded-xl transition-colors cursor-not-allowed text-sm font-semibold">
                {language === 'en' ? "Contact Support" : (language === 'sw' ? "Wasiliana na Msaada" : "Tudri Kodwa")}
            </button>
        </div>
      </div>
    </div>
  );
};

export default FaqPage;

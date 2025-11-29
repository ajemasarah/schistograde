import React, { useState, useRef } from 'react';
import { Language } from '../App';
import { ShieldIcon, SnailIcon, LocationIcon, AlertIcon, DropIcon, BotIcon, ChevronDownIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from '@google/genai';

interface RiskAssessmentProps {
  language: Language;
}

type Step = 'intro' | 'geo' | 'behavior' | 'clinical' | 'snail' | 'result';

interface AssessmentData {
  // Geo
  latitude: number | null;
  longitude: number | null;
  detectedLocation: string;
  nearWater: boolean;
  waterStagnant: boolean;
  
  // Behavior
  occupation: string;
  activities: string[]; // swimming, washing, fishing
  latrineAccess: boolean;
  
  // Clinical
  age: number;
  bloodInUrine: boolean; // Hematuria
  painUrination: boolean; // Terminal dysuria
  
  // Snail
  snailRisk: 'none' | 'possible' | 'high';
}

// Known Schisto Hotspots in Kenya (Coordinates are approximate centers)
const KENYAN_RISK_ZONES = [
    { name: "Lake Victoria Basin (Kisumu/Homa Bay)", lat: -0.100, lng: 34.750, radiusKm: 80 },
    { name: "Mwea Irrigation Scheme", lat: -0.716, lng: 37.360, radiusKm: 25 },
    { name: "Coast (Kwale/Msambweni)", lat: -4.170, lng: 39.450, radiusKm: 40 },
    { name: "Lake Baringo", lat: 0.630, lng: 36.050, radiusKm: 15 },
    { name: "Lake Naivasha", lat: -0.770, lng: 36.420, radiusKm: 15 },
    { name: "Taveta / Lake Jipe", lat: -3.580, lng: 37.750, radiusKm: 20 }
];

const RiskAssessment: React.FC<RiskAssessmentProps> = ({ language }) => {
  const [step, setStep] = useState<Step>('intro');
  const [loading, setLoading] = useState(false);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'locating' | 'found' | 'denied'>('idle');
  
  // Data State
  const [data, setData] = useState<AssessmentData>({
    latitude: null,
    longitude: null,
    detectedLocation: '',
    nearWater: false,
    waterStagnant: false,
    occupation: '',
    activities: [],
    latrineAccess: true,
    age: 18,
    bloodInUrine: false,
    painUrination: false,
    snailRisk: 'none',
  });

  // Snail Cam State
  const [snailImage, setSnailImage] = useState<string | null>(null);
  const [snailAnalysis, setSnailAnalysis] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Haversine Formula for distance in KM
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c;
  };

  // Geo Logic
  const handleGeolocation = () => {
    setGeoStatus('locating');
    
    if (!navigator.geolocation) {
        setGeoStatus('denied');
        setStep('geo');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            let nearHotspot = false;
            let locationName = '';

            // Check against Kenyan zones
            for (const zone of KENYAN_RISK_ZONES) {
                const dist = calculateDistance(latitude, longitude, zone.lat, zone.lng);
                if (dist <= zone.radiusKm) {
                    nearHotspot = true;
                    locationName = zone.name;
                    break;
                }
            }

            setData(prev => ({
                ...prev,
                latitude,
                longitude,
                nearWater: nearHotspot,
                detectedLocation: locationName || 'Unknown Location'
            }));

            setGeoStatus('found');
            // Small delay to read the status before moving
            setTimeout(() => setStep('geo'), 2000);
        },
        (error) => {
            console.error(error);
            setGeoStatus('denied');
            setStep('geo');
        }
    );
  };

  // Helper to update state
  const updateData = (key: keyof AssessmentData, value: any) => {
    setData(prev => ({ ...prev, [key]: value }));
  };

  const toggleActivity = (activity: string) => {
    setData(prev => {
        const active = prev.activities.includes(activity);
        return {
            ...prev,
            activities: active 
                ? prev.activities.filter(a => a !== activity)
                : [...prev.activities, activity]
        };
    });
  };

  // Snail AI Logic
  const handleSnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = async () => {
              const base64 = (reader.result as string).split(',')[1];
              setSnailImage(reader.result as string);
              setLoading(true);

              try {
                  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
                  
                  const prompt = `Analyze this image of a snail. 
                  1. Identify if it looks like a Biomphalaria or Bulinus species (vectors for Schistosomiasis) or a generic garden snail.
                  2. If it is a vector, state "HIGH RISK". If harmless, state "LOW RISK".
                  3. Provide a 1 sentence explanation.`;
                  
                  const response = await ai.models.generateContent({
                      model: 'gemini-2.5-flash',
                      contents: {
                          parts: [
                              { text: prompt },
                              { inlineData: { mimeType: file.type, data: base64 } }
                          ]
                      }
                  });
                  
                  const text = response.text || '';
                  setSnailAnalysis(text);
                  
                  if (text && (text.toLowerCase().includes('high risk') || text.toLowerCase().includes('bulinus') || text.toLowerCase().includes('biomphalaria'))) {
                      updateData('snailRisk', 'high');
                  } else {
                      updateData('snailRisk', 'none');
                  }

              } catch (error) {
                  console.error(error);
                  setSnailAnalysis("Could not identify. Please try again.");
              } finally {
                  setLoading(false);
              }
          };
          reader.readAsDataURL(file);
      }
  };

  // Risk Calculation Engine
  const calculateRiskScore = () => {
      let score = 0;
      const reasons: string[] = [];

      // Clinical (Highest Weight)
      if (data.bloodInUrine) { score += 50; reasons.push("Hematuria (Blood in urine) is a critical symptom."); }
      if (data.painUrination) { score += 20; reasons.push("Painful urination suggests infection."); }

      // Environmental
      if (data.nearWater) {
          score += 20;
          reasons.push(data.detectedLocation 
            ? `Located near ${data.detectedLocation} (High Risk Zone).`
            : "Proximity to water body detected.");
          
          if (data.waterStagnant) { score += 10; reasons.push("Stagnant water supports snail breeding."); }
      }

      // Behavioral
      if (data.activities.includes('swimming') || data.activities.includes('fishing')) {
          score += 20;
          reasons.push("Direct water contact activities are high risk.");
      }
      if (data.occupation === 'farmer' || data.occupation === 'fisherman') {
          score += 15;
          reasons.push("Occupational hazard detected.");
      }
      if (!data.latrineAccess) {
          score += 10;
          reasons.push("Lack of sanitation contributes to transmission cycles.");
      }

      // Snail
      if (data.snailRisk === 'high') {
          score += 25;
          reasons.push("Presence of vector snails confirmed.");
      }

      return { score: Math.min(score, 100), reasons };
  };

  const riskResult = calculateRiskScore();
  const getRiskLabel = (score: number) => {
      if (score < 20) return { label: language === 'luo' ? 'Masira Matin' : 'Low Risk', color: 'text-green-500', bg: 'bg-green-100' };
      if (score < 50) return { label: language === 'luo' ? 'Masira' : 'Moderate Risk', color: 'text-yellow-600', bg: 'bg-yellow-100' };
      return { label: language === 'luo' ? 'Masira Maduong' : 'High Risk', color: 'text-red-500', bg: 'bg-red-100' };
  };
  const riskMeta = getRiskLabel(riskResult.score);

  // Translations
  const t = {
    title: language === 'en' ? 'Risk Assessment' : (language === 'sw' ? 'Tathmini ya Hatari' : 'Pimo Masira'),
    introTitle: language === 'en' ? 'Check Your Risk Level' : (language === 'sw' ? 'Angalia Kiwango Chako cha Hatari' : 'Pim Kaka Masira Romo'),
    introDesc: language === 'en' 
        ? "This tool analyzes your location in Kenya, environmental factors, and symptoms to estimate your risk of Schistosomiasis."
        : (language === 'sw' 
            ? "Chombo hiki huchambua eneo lako nchini Kenya, mazingira, na dalili kukadiria hatari yako ya Kichocho."
            : "Watiyo gi location mari, aluorami, kod ranyisi mondo wane ka intie e masira mar Kichocho."),
    btnStart: language === 'en' ? 'Start Assessment' : (language === 'sw' ? 'Anza' : 'Chak'),
    accessGps: language === 'en' ? 'Accessing GPS...' : (language === 'sw' ? 'Inatafuta GPS...' : 'Manyo GPS...'),
    locFound: language === 'en' ? 'Location Found!' : (language === 'sw' ? 'Eneo Limepatikana!' : 'Location Oyudore!'),
    gpsDenied: language === 'en' ? 'GPS access denied.' : 'GPS ok oyudore.',
    envTitle: language === 'en' ? 'Environment' : (language === 'sw' ? 'Mazingira' : 'Aluora'),
    riskZone: language === 'en' ? 'High Risk Zone Detected' : (language === 'sw' ? 'Eneo la Hatari' : 'Ka en kuonde masira'),
    qNearWater: language === 'en' ? 'Do you live near a lake, river, or dam (<500m)?' : (language === 'sw' ? 'Unaishi karibu na ziwa, mto au bwawa?' : 'Idak machiegni gi nam, aora, kata dam?'),
    qStagnant: language === 'en' ? 'Is the water stagnant or slow-moving?' : (language === 'sw' ? 'Je, maji yametwama?' : 'Pi obedo ma ok mol?'),
    actTitle: language === 'en' ? 'Activities & Lifestyle' : (language === 'sw' ? 'Shughuli na Maisha' : 'Tich kod Dak'),
    qOcc: language === 'en' ? 'Occupation' : (language === 'sw' ? 'Kazi' : 'Tich'),
    qWaterContact: language === 'en' ? 'Water Contact Activities' : (language === 'sw' ? 'Kugusa Maji' : 'Tich e Pi'),
    qLatrine: language === 'en' ? 'Do you have a latrine at home?' : (language === 'sw' ? 'Una choo nyumbani?' : 'Un gi choo e dala?'),
    sympTitle: language === 'en' ? 'Symptoms' : (language === 'sw' ? 'Dalili' : 'Ranyisi'),
    qBlood: language === 'en' ? 'Blood in Urine?' : (language === 'sw' ? 'Damu kwenye mkojo?' : 'Remo e lach?'),
    qPain: language === 'en' ? 'Pain while urinating?' : (language === 'sw' ? 'Maumivu wakati wa kukojoa?' : 'Remo ka ilayo?'),
    qAge: language === 'en' ? 'Age' : (language === 'sw' ? 'Umri' : 'Higa'),
    snailTitle: language === 'en' ? 'Snail Identification (Beta)' : (language === 'sw' ? 'Utambuzi wa Konokono' : 'Fwenyo Kamongo'),
    snailDesc: language === 'en' ? 'If you see a snail near water, take a picture.' : (language === 'sw' ? 'Piga picha ukiona konokono.' : 'Go picha ka ineno kamongo.'),
    snap: language === 'en' ? 'Snap/Upload Snail' : (language === 'sw' ? 'Piga/Pakia Picha' : 'Go/Or Picha'),
    calc: language === 'en' ? 'Calculate Risk' : (language === 'sw' ? 'Kadiria Hatari' : 'Pim Masira'),
    next: language === 'en' ? 'Next' : (language === 'sw' ? 'Endelea' : 'Dhi Nyime'),
    back: language === 'en' ? 'Back' : (language === 'sw' ? 'Nyuma' : 'Cen'),
    factors: language === 'en' ? 'Key Risk Factors:' : (language === 'sw' ? 'Sababu za Hatari:' : 'Gik makelo Masira:'),
    startOver: language === 'en' ? 'Start Over' : (language === 'sw' ? 'Anza Upya' : 'Chak Manyien'),
  };

  // Animations
  const pageVariants = {
      initial: { opacity: 0, x: 50 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -50 }
  };

  return (
    <div className="flex flex-col h-full bg-[#F8FAFC] overflow-y-auto">
      {/* Header */}
      <div className="bg-white p-4 shadow-sm z-10 sticky top-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldIcon className="w-6 h-6 text-blue-600" />
            <h2 className="font-bold text-gray-800">{t.title}</h2>
          </div>
          {step !== 'intro' && step !== 'result' && (
              <div className="text-xs font-mono text-gray-400">Step {['intro','geo','behavior','clinical','snail','result'].indexOf(step)}/5</div>
          )}
      </div>

      <div className="flex-grow p-6 max-w-2xl mx-auto w-full flex flex-col justify-center">
        <AnimatePresence mode="wait">
            
            {/* INTRO */}
            {step === 'intro' && (
                <motion.div key="intro" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="text-center">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                        <ShieldIcon className="w-12 h-12 text-blue-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">{t.introTitle}</h1>
                    <p className="text-gray-500 mb-8 leading-relaxed">{t.introDesc}</p>
                    <button 
                        onClick={handleGeolocation}
                        disabled={geoStatus === 'locating'}
                        className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-200 hover:scale-[1.02] transition-transform disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {geoStatus === 'locating' ? t.accessGps : t.btnStart}
                    </button>
                    {geoStatus === 'locating' && (
                         <div className="mt-6 p-4 bg-gray-900 text-green-400 font-mono text-xs text-left rounded-lg overflow-hidden animate-pulse">
                                <p>&gt; GPS...</p>
                         </div>
                    )}
                    {geoStatus === 'found' && (
                        <div className="mt-6 p-4 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200">
                             {t.locFound}
                        </div>
                    )}
                    {geoStatus === 'denied' && (
                        <div className="mt-4 text-xs text-red-400">
                             {t.gpsDenied}
                        </div>
                    )}
                </motion.div>
            )}

            {/* GEO */}
            {step === 'geo' && (
                <motion.div key="geo" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <LocationIcon className="w-6 h-6 text-green-600" />
                        {t.envTitle}
                    </h3>
                    
                    {data.detectedLocation && (
                        <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3">
                            <AlertIcon className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="font-bold text-orange-700 text-sm">{t.riskZone}</h4>
                                <p className="text-xs text-orange-600 mt-1">{data.detectedLocation}</p>
                            </div>
                        </div>
                    )}
                    
                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-blue-300 transition-colors">
                            <span>{t.qNearWater}</span>
                            <input 
                                type="checkbox" 
                                checked={data.nearWater} 
                                onChange={(e) => updateData('nearWater', e.target.checked)}
                                className="w-5 h-5 text-blue-600 rounded" 
                            />
                        </label>
                         <label className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 cursor-pointer hover:border-blue-300 transition-colors">
                            <span>{t.qStagnant}</span>
                            <input 
                                type="checkbox" 
                                checked={data.waterStagnant} 
                                onChange={(e) => updateData('waterStagnant', e.target.checked)}
                                className="w-5 h-5 text-blue-600 rounded" 
                            />
                        </label>
                    </div>

                    <div className="mt-8 flex justify-end">
                        <button onClick={() => setStep('behavior')} className="bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold">
                            {t.next}
                        </button>
                    </div>
                </motion.div>
            )}

            {/* BEHAVIOR */}
            {step === 'behavior' && (
                <motion.div key="behavior" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <DropIcon className="w-6 h-6 text-blue-500" />
                        {t.actTitle}
                    </h3>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-500 mb-2">{t.qOcc}</label>
                            <select 
                                value={data.occupation} 
                                onChange={(e) => updateData('occupation', e.target.value)}
                                className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-100 outline-none"
                            >
                                <option value="">Select...</option>
                                <option value="farmer">Farmer (Mkulima/Japur)</option>
                                <option value="fisherman">Fisherman (Mvuvi/Jaluo)</option>
                                <option value="student">Student (Mwanafunzi/Japuonjre)</option>
                                <option value="other">Other (Nyingine/Machelo)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-500 mb-2">{t.qWaterContact}</label>
                            <div className="flex flex-wrap gap-2">
                                {['swimming', 'fishing', 'washing', 'playing'].map(act => (
                                    <button
                                        key={act}
                                        onClick={() => toggleActivity(act)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                                            data.activities.includes(act) 
                                                ? 'bg-blue-600 text-white shadow-md' 
                                                : 'bg-white text-gray-600 border border-gray-200'
                                        }`}
                                    >
                                        {act.charAt(0).toUpperCase() + act.slice(1)}
                                    </button>
                                ))}
                            </div>
                        </div>

                         <label className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 cursor-pointer">
                            <span>{t.qLatrine}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400">{data.latrineAccess ? 'Yes' : 'No'}</span>
                                <input 
                                    type="checkbox" 
                                    checked={data.latrineAccess} 
                                    onChange={(e) => updateData('latrineAccess', e.target.checked)}
                                    className="w-5 h-5 text-blue-600 rounded" 
                                />
                            </div>
                        </label>
                    </div>

                    <div className="mt-8 flex justify-between">
                         <button onClick={() => setStep('geo')} className="text-gray-400 px-4">{t.back}</button>
                        <button onClick={() => setStep('clinical')} className="bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold">
                            {t.next}
                        </button>
                    </div>
                </motion.div>
            )}

            {/* CLINICAL */}
            {step === 'clinical' && (
                <motion.div key="clinical" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <AlertIcon className="w-6 h-6 text-red-500" />
                        {t.sympTitle}
                    </h3>

                    <div className="space-y-4">
                        <label className="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl cursor-pointer">
                            <div>
                                <span className="font-semibold text-red-800">{t.qBlood}</span>
                                <p className="text-xs text-red-400 mt-1">Hematuria</p>
                            </div>
                            <input 
                                type="checkbox" 
                                checked={data.bloodInUrine} 
                                onChange={(e) => updateData('bloodInUrine', e.target.checked)}
                                className="w-5 h-5 text-red-600 rounded" 
                            />
                        </label>

                         <label className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl cursor-pointer">
                            <span>{t.qPain}</span>
                            <input 
                                type="checkbox" 
                                checked={data.painUrination} 
                                onChange={(e) => updateData('painUrination', e.target.checked)}
                                className="w-5 h-5 text-blue-600 rounded" 
                            />
                        </label>

                        <div className="pt-4">
                             <label className="block text-sm font-semibold text-gray-500 mb-2">{t.qAge}</label>
                             <input 
                                type="range" min="1" max="100" 
                                value={data.age} 
                                onChange={(e) => updateData('age', parseInt(e.target.value))}
                                className="w-full accent-blue-600"
                             />
                             <div className="text-center font-bold text-gray-800">{data.age}</div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-between">
                         <button onClick={() => setStep('behavior')} className="text-gray-400 px-4">{t.back}</button>
                        <button onClick={() => setStep('snail')} className="bg-gray-800 text-white px-6 py-3 rounded-xl font-semibold">
                            {t.next}
                        </button>
                    </div>
                </motion.div>
            )}

            {/* SNAIL CAM */}
            {step === 'snail' && (
                <motion.div key="snail" variants={pageVariants} initial="initial" animate="animate" exit="exit">
                     <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                        <SnailIcon className="w-6 h-6 text-orange-500" />
                        {t.snailTitle}
                    </h3>
                    
                    <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl text-center mb-6">
                        <p className="text-sm text-orange-800 mb-4">{t.snailDesc}</p>
                        
                        <input 
                            type="file" 
                            accept="image/*" 
                            ref={fileInputRef} 
                            onChange={handleSnailUpload} 
                            className="hidden" 
                        />
                        
                        {!snailImage ? (
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-bold shadow-md transition-colors"
                            >
                                {t.snap}
                            </button>
                        ) : (
                            <div className="relative">
                                <img src={snailImage} alt="Snail" className="w-full h-48 object-cover rounded-xl mb-4" />
                                {loading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl text-white font-bold animate-pulse">
                                        Analyzing...
                                    </div>
                                )}
                            </div>
                        )}

                        {snailAnalysis && !loading && (
                            <div className="mt-4 p-3 bg-white rounded-lg text-sm text-gray-700 border border-orange-200 shadow-sm">
                                <BotIcon className="w-4 h-4 inline-block mr-2 text-blue-500"/>
                                {snailAnalysis}
                            </div>
                        )}
                    </div>

                    <div className="mt-8 flex justify-between">
                         <button onClick={() => setStep('clinical')} className="text-gray-400 px-4">{t.back}</button>
                        <button onClick={() => setStep('result')} className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-200">
                            {t.calc}
                        </button>
                    </div>
                </motion.div>
            )}

            {/* RESULT */}
            {step === 'result' && (
                <motion.div key="result" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="text-center">
                    <div className="mb-6 relative inline-block">
                        <svg className="w-40 h-40 transform -rotate-90">
                            <circle cx="80" cy="80" r="70" stroke="#f3f4f6" strokeWidth="15" fill="none" />
                            <circle 
                                cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="15" fill="none"
                                className={riskMeta.color}
                                strokeDasharray={440}
                                strokeDashoffset={440 - (440 * riskResult.score) / 100}
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold text-gray-800">{riskResult.score}%</span>
                            <span className="text-xs text-gray-400 uppercase tracking-wider">Score</span>
                        </div>
                    </div>

                    <div className={`inline-block px-4 py-2 rounded-full font-bold text-sm mb-6 ${riskMeta.bg} ${riskMeta.color}`}>
                        {riskMeta.label}
                    </div>

                    <div className="bg-white text-left p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                        <h4 className="font-bold text-gray-700 mb-4">{t.factors}</h4>
                        <ul className="space-y-2">
                            {riskResult.reasons.length > 0 ? (
                                riskResult.reasons.map((r, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                        <AlertIcon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                                        {r}
                                    </li>
                                ))
                            ) : (
                                <li className="text-green-600 text-sm">No major risk factors detected.</li>
                            )}
                        </ul>
                    </div>
                    
                    <button 
                        onClick={() => { setStep('intro'); setData(prev => ({...prev, snailRisk: 'none', bloodInUrine: false, detectedLocation: '', nearWater: false})); }} 
                        className="text-gray-400 text-sm hover:text-gray-600"
                    >
                        {t.startOver}
                    </button>
                </motion.div>
            )}

        </AnimatePresence>
      </div>
    </div>
  );
};

export default RiskAssessment;

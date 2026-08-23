import React, { createContext, useContext, useEffect, useState } from 'react';

// English is the default. A user can switch to Hindi (layman) via the toggle
// in the top-left of the public site; the choice is remembered in localStorage.
const LANG_KEY = 'cc_lang';

const DICT = {
  en: {
    'brand.tagline': 'Delhi Collection',
    'landing.headline': 'Spin & Win',
    'landing.subheadline': 'Spin the wheel and unlock a trending reward from Delhi Collection.',
    'landing.cta': 'Spin Now',
    'landing.history': 'My reward history',
    'landing.disclaimer': 'No purchase necessary · Limited spins',
    'landing.preparing': 'Preparing…',
    'brand.line1': "👑 #bharwara No 1 Men's & Boys Collection Shop",
    'brand.line2': '❤️ Loved by Customers from Darbhanga & Muzaffarpur',
    'brand.line3': "👕 Men's Wear | Streetwear | Trending Fashion",
    'brand.line4': '📍 Main Road, Bouka Chowk, Bharwara, Bihar',
    'admin.link': 'Admin',
    'lang.toggle': 'हिंदी',
    'verify.eyebrow': 'Almost there',
    'verify.title': 'Claim your spins',
    'verify.subtitle': 'We use your number to track your spins — no account needed.',
    'verify.name': 'Full name',
    'verify.namePlaceholder': 'Your name',
    'verify.phone': 'Mobile number',
    'verify.phonePlaceholder': '98765 43210',
    'verify.continue': 'Continue',
    'verify.errName': 'Please enter your full name.',
    'verify.errPhone': 'Please enter a valid 10-digit mobile number.',
    'verify.errGeneric': 'Something went wrong. Please try again.',
    'wheel.spin': 'Spin the wheel',
    'wheel.noSpins': 'No spins remaining',
    'wheel.button': 'Spin',
    'wheel.comeBack': 'Come back soon',
    'wheel.remaining': '{n} spins remaining',
    'wheel.muteOn': 'Mute',
    'wheel.muteOff': 'Unmute',
    'wheel.errLimit': 'You have used all your spins for this cycle.',
    'wheel.errWon': 'You have already won in this cycle. Please try again next cycle.',
    'wheel.errSpin': 'Spin failed. Please try again.',
    'result.won': 'You won',
    'result.code': 'Your code',
    'result.validUntil': 'Valid until',
    'result.spinAgain': 'Spin again',
    'result.claim': 'Claim reward',
    'result.back': 'Back to start',
    'result.loseDefault': 'So close!',
    'result.loseSubTry': 'You still have a spin left — try your luck again.',
    'result.loseSubDone': 'Your spins for this cycle are used. Come back soon.',
    'history.title': 'My reward history',
    'history.subtitle': 'Enter the number you used to spin to view your previous rewards and coupons.',
    'history.view': 'View history',
    'history.welcome': 'Welcome back,',
    'history.totalSpins': 'total spins',
    'history.coupons': 'Your coupons',
    'history.noCoupons': 'No coupons won yet.',
    'history.expires': 'Expires',
    'history.claimed': 'claimed',
    'history.recent': 'Recent spins',
    'history.noSpins': 'No spins recorded.',
    'history.tryAgain': 'Try again',
    'history.prizeWon': 'Prize won',
    'history.err': 'No spins found for this number.',
    'history.errPhone': 'Please enter a valid 10-digit mobile number.'
  },
  hi: {
    'brand.tagline': 'दिल्ली कलेक्शन',
    'landing.headline': 'स्पिन करें और जीतें',
    'landing.subheadline': 'व्हील घुमाएँ और दिल्ली कलेक्शन का ट्रेंडिंग रिवॉर्ड पाएं।',
    'landing.cta': 'अभी स्पिन करें',
    'landing.history': 'मेरा रिवॉर्ड इतिहास',
    'landing.disclaimer': 'खरीद जरूरी नहीं · सीमित स्पिन',
    'landing.preparing': 'तैयारी हो रही है…',
    'brand.line1': '👑 भारवारा का नंबर 1 मेन्स एंड बॉयज कलेक्शन',
    'brand.line2': '❤️ दरभंगा और मुजफ्फरपुर के प्रिय ग्राहकों द्वारा',
    'brand.line3': '👕 मेन्स वियर · स्ट्रीटवियर · ट्रेंडिंग फैशन',
    'brand.line4': '📍 मेन रोड, बौका चौक, भारवारा, बिहार',
    'admin.link': 'एडमिन',
    'lang.toggle': 'English',
    'verify.eyebrow': 'बस थोड़ा और',
    'verify.title': 'अपने स्पिन क्लेम करें',
    'verify.subtitle': 'हम आपके स्पिन ट्रैक करने के लिए नंबर इस्तेमाल करते हैं — कोई अकाउंट जरूरी नहीं।',
    'verify.name': 'पूरा नाम',
    'verify.namePlaceholder': 'आपका नाम',
    'verify.phone': 'मोबाइल नंबर',
    'verify.phonePlaceholder': '98765 43210',
    'verify.continue': 'जारी रखें',
    'verify.errName': 'कृपया अपना पूरा नाम दर्ज करें।',
    'verify.errPhone': 'कृपया 10 अंकों का मोबाइल नंबर दर्ज करें।',
    'verify.errGeneric': 'कुछ गलत हुआ। कृपया फिर कोशिश करें।',
    'wheel.spin': 'व्हील घुमाएँ',
    'wheel.noSpins': 'कोई स्पिन बचा नहीं',
    'wheel.button': 'स्पिन',
    'wheel.comeBack': 'फिर आइए',
    'wheel.remaining': '{n} स्पिन बचे हैं',
    'wheel.muteOn': 'साउंड बंद करें',
    'wheel.muteOff': 'साउंड चालू करें',
    'wheel.errLimit': 'आपने इस चक्र के सभी स्पिन इस्तेमाल कर लिए हैं।',
    'wheel.errWon': 'आप इस चक्र में पहले ही जीत चुके हैं। अगले चक्र में फिर कोशिश करें।',
    'wheel.errSpin': 'स्पिन विफल हुआ। कृपया फिर कोशिश करें।',
    'result.won': 'आप जीते',
    'result.code': 'आपका कोड',
    'result.validUntil': 'वैध तब तक',
    'result.spinAgain': 'फिर से स्पिन करें',
    'result.claim': 'क्लेम करें',
    'result.back': 'शुरुआत पर जाएं',
    'result.loseDefault': 'बस थोड़ा और!',
    'result.loseSubTry': 'आपका एक स्पिन बचा है — फिर कोशिश करें।',
    'result.loseSubDone': 'इस चक्र के सभी स्पिन खत्म। जल्दी फिर आइए।',
    'history.title': 'मेरा रिवॉर्ड इतिहास',
    'history.subtitle': 'अपने पिछले रिवॉर्ड और कूपन देखने के लिए वह नंबर दर्ज करें जिससे आपने स्पिन किया था।',
    'history.view': 'इतिहास देखें',
    'history.welcome': 'वापसी पर स्वागत है,',
    'history.totalSpins': 'कुल स्पिन',
    'history.coupons': 'आपके कूपन',
    'history.noCoupons': 'अभी तक कोई कूपन नहीं जीता।',
    'history.expires': 'वैध',
    'history.claimed': 'क्लेम किया',
    'history.recent': 'हाल के स्पिन',
    'history.noSpins': 'कोई स्पिन रिकॉर्ड नहीं।',
    'history.tryAgain': 'फिर कोशिश',
    'history.prizeWon': 'रिवॉर्ड जीता',
    'history.err': 'इस नंबर के लिए कोई स्पिन नहीं मिला।',
    'history.errPhone': 'कृपया 10 अंकों का मोबाइल नंबर दर्ज करें।'
  }
};

const LangContext = createContext({ lang: 'en', setLang: () => {}, toggle: () => {}, t: (k) => k });

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    if (typeof window === 'undefined') return 'en';
    return localStorage.getItem(LANG_KEY) === 'hi' ? 'hi' : 'en';
  });
  useEffect(() => {
    try { localStorage.setItem(LANG_KEY, lang); } catch {}
  }, [lang]);
  const t = (key, vars) => {
    let s = (DICT[lang] && DICT[lang][key]) || DICT.en[key] || key;
    if (vars) Object.keys(vars).forEach((k) => { s = s.replace(`{${k}}`, String(vars[k])); });
    return s;
  };
  const toggle = () => setLang((l) => (l === 'en' ? 'hi' : 'en'));
  return <LangContext.Provider value={{ lang, setLang, toggle, t }}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
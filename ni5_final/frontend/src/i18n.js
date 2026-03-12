const T = {
  en: {
    nav: { dashboard:'Dashboard', analyze:'Analyze', text:'Single Text', history:'History', compare:'Compare', trends:'Trends', tickets:'Support Tickets', verify:'Hash Verify', watchlist:'Watchlist', profile:'Profile' },
    login: { title:'Welcome back', sub:'Sign in to NestInsights', user:'Username', pass:'Password', btn:'Sign In', noAcc:"Don't have an account?", reg:'Register' },
    reg:   { title:'Create Account', sub:'Join NestInsights today', user:'Username', email:'Email', pass:'Password', btn:'Create Account', hasAcc:'Already have an account?', login:'Sign in' },
    common: { analyze:'Analyze', upload:'Upload', loading:'Loading…', export:'Export CSV', delete:'Delete', cancel:'Cancel', save:'Save', search:'Search', back:'Back', total:'Total', positive:'Positive', negative:'Negative', neutral:'Neutral' },
    theme: { dark:'Dark', light:'Light' },
  },
  ur: {
    nav: { dashboard:'ڈیش بورڈ', analyze:'تجزیہ', text:'واحد متن', history:'تاریخ', compare:'موازنہ', trends:'رجحانات', tickets:'ٹکٹس', verify:'ہیش تصدیق', watchlist:'واچ لسٹ', profile:'پروفائل' },
    login: { title:'خوش آمدید', sub:'سائن ان کریں', user:'صارف نام', pass:'پاس ورڈ', btn:'سائن ان', noAcc:'اکاؤنٹ نہیں؟', reg:'رجسٹر' },
    reg:   { title:'اکاؤنٹ بنائیں', sub:'آج شامل ہوں', user:'صارف نام', email:'ای میل', pass:'پاس ورڈ', btn:'اکاؤنٹ بنائیں', hasAcc:'پہلے سے اکاؤنٹ ہے؟', login:'سائن ان' },
    common: { analyze:'تجزیہ', upload:'اپلوڈ', loading:'لوڈ ہو رہا ہے…', export:'CSV برآمد', delete:'حذف', cancel:'منسوخ', save:'محفوظ', search:'تلاش', back:'واپس', total:'کل', positive:'مثبت', negative:'منفی', neutral:'غیر جانبدار' },
    theme: { dark:'گہرا', light:'روشن' },
  },
  de: {
    nav: { dashboard:'Dashboard', analyze:'Analysieren', text:'Einzeltext', history:'Verlauf', compare:'Vergleich', trends:'Trends', tickets:'Support-Tickets', verify:'Hash-Prüfung', watchlist:'Watchlist', profile:'Profil' },
    login: { title:'Willkommen zurück', sub:'In NestInsights anmelden', user:'Benutzername', pass:'Passwort', btn:'Anmelden', noAcc:'Noch kein Konto?', reg:'Registrieren' },
    reg:   { title:'Konto erstellen', sub:'Heute beitreten', user:'Benutzername', email:'E-Mail', pass:'Passwort', btn:'Konto erstellen', hasAcc:'Bereits ein Konto?', login:'Anmelden' },
    common: { analyze:'Analysieren', upload:'Hochladen', loading:'Laden…', export:'CSV exportieren', delete:'Löschen', cancel:'Abbrechen', save:'Speichern', search:'Suchen', back:'Zurück', total:'Gesamt', positive:'Positiv', negative:'Negativ', neutral:'Neutral' },
    theme: { dark:'Dunkel', light:'Hell' },
  },
  pa: {
    nav: { dashboard:'ਡੈਸ਼ਬੋਰਡ', analyze:'ਵਿਸ਼ਲੇਸ਼ਣ', text:'ਸਿੰਗਲ ਟੈਕਸਟ', history:'ਇਤਿਹਾਸ', compare:'ਤੁਲਨਾ', trends:'ਰੁਝਾਨ', tickets:'ਟਿਕਟਾਂ', verify:'ਹੈਸ਼ ਤਸਦੀਕ', watchlist:'ਵਾਚਲਿਸਟ', profile:'ਪ੍ਰੋਫਾਈਲ' },
    login: { title:'ਸੁਆਗਤ ਹੈ', sub:'ਸਾਈਨ ਇਨ ਕਰੋ', user:'ਉਪਭੋਗਤਾ ਨਾਮ', pass:'ਪਾਸਵਰਡ', btn:'ਸਾਈਨ ਇਨ', noAcc:'ਖਾਤਾ ਨਹੀਂ?', reg:'ਰਜਿਸਟਰ' },
    reg:   { title:'ਖਾਤਾ ਬਣਾਓ', sub:'ਅੱਜ ਸ਼ਾਮਲ ਹੋਵੋ', user:'ਉਪਭੋਗਤਾ ਨਾਮ', email:'ਈਮੇਲ', pass:'ਪਾਸਵਰਡ', btn:'ਖਾਤਾ ਬਣਾਓ', hasAcc:'ਪਹਿਲਾਂ ਖਾਤਾ ਹੈ?', login:'ਸਾਈਨ ਇਨ' },
    common: { analyze:'ਵਿਸ਼ਲੇਸ਼ਣ', upload:'ਅਪਲੋਡ', loading:'ਲੋਡ ਹੋ ਰਿਹਾ…', export:'CSV ਨਿਰਯਾਤ', delete:'ਮਿਟਾਓ', cancel:'ਰੱਦ', save:'ਸੰਭਾਲੋ', search:'ਖੋਜ', back:'ਵਾਪਸ', total:'ਕੁੱਲ', positive:'ਸਕਾਰਾਤਮਕ', negative:'ਨਕਾਰਾਤਮਕ', neutral:'ਨਿਰਪੱਖ' },
    theme: { dark:'ਹਨੇਰਾ', light:'ਚਾਨਣ' },
  },
}

export const LANGS = [
  { code:'en', label:'EN', name:'English',  flag:'' },
  { code:'ur', label:'اُردو', name:'اردو',  flag:'' },
  { code:'de', label:'DE', name:'Deutsch',  flag:'' },
  { code:'pa', label:'ਪੰਜਾਬੀ', name:'ਪੰਜਾਬੀ', flag:'' },
]

export function t(lang, path) {
  const keys = path.split('.')
  let obj = T[lang] || T.en
  for (const k of keys) {
    obj = obj?.[k]
    if (obj === undefined) {
      let fb = T.en
      for (const fk of keys) fb = fb?.[fk]
      return fb || path
    }
  }
  return obj || path
}

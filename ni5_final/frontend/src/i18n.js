// ─── Language config ───────────────────────────────────────────────────────
export const LANGS = [
  { code: 'en', gtCode: 'en', label: 'EN',    name: 'English' },
  { code: 'ur', gtCode: 'ur', label: 'اردو',  name: 'Urdu'    },
  { code: 'ar', gtCode: 'ar', label: 'عربي',  name: 'Arabic'  },
  { code: 'fr', gtCode: 'fr', label: 'FR',    name: 'French'  },
]

// ─── Google Translate engine ──────────────────────────────────────────────
let _gtReady = false
let _pendingLang = null

function _injectHideGTBar() {
  if (document.getElementById('gt-hide-style')) return
  const s = document.createElement('style')
  s.id = 'gt-hide-style'
  s.textContent = `
    .goog-te-banner-frame, .goog-te-balloon-frame,
    #goog-gt-tt, .goog-tooltip, .goog-tooltip:hover,
    .goog-text-highlight, .skiptranslate { display: none !important; }
    body { top: 0 !important; }
  `
  document.head.appendChild(s)
}

function _doTranslate(gtCode) {
  // Set cookie — this is what Google Translate uses to remember language
  const exp = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `googtrans=/en/${gtCode}; expires=${exp}; path=/`
  document.cookie = `googtrans=/en/${gtCode}; expires=${exp}; path=/; domain=${location.hostname}`

  // Try using the combo select if widget is already rendered
  const sel = document.querySelector('.goog-te-combo')
  if (sel) {
    sel.value = gtCode
    sel.dispatchEvent(new Event('change'))
    return
  }
  // Widget not ready yet — reload so cookie takes effect
  window.location.reload()
}

function _revertEnglish() {
  const clr = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
  document.cookie = clr
  document.cookie = clr + `; domain=${location.hostname}`
  document.documentElement.dir = 'ltr'
  document.documentElement.lang = 'en'

  // Click restore if banner is showing
  const btn = document.querySelector('.goog-te-restore-el')
  if (btn) { btn.click(); return }

  // Try GT API
  try {
    const te = window.google?.translate?.TranslateElement?.getInstance?.()
    if (te) { te.restore(); return }
  } catch (e) {}

  window.location.reload()
}

export function initTranslation() {
  _injectHideGTBar()

  if (document.getElementById('gt-script')) return

  window.googleTranslateElementInit = function () {
    _gtReady = true
    // Instantiate hidden widget
    new window.google.translate.TranslateElement(
      { pageLanguage: 'en', autoDisplay: false },
      'google_translate_element'
    )
    if (_pendingLang) {
      _doTranslate(_pendingLang)
      _pendingLang = null
    }
  }

  // Hidden container GT needs
  if (!document.getElementById('google_translate_element')) {
    const div = document.createElement('div')
    div.id = 'google_translate_element'
    div.style.cssText = 'position:fixed;top:-9999px;left:-9999px;'
    document.body.appendChild(div)
  }

  const sc = document.createElement('script')
  sc.id = 'gt-script'
  sc.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
  sc.async = true
  document.head.appendChild(sc)
}

export function applyLanguage(code) {
  const lang = LANGS.find(l => l.code === code)
  if (!lang) return

  // RTL for Urdu and Arabic
  document.documentElement.dir = (code === 'ur' || code === 'ar') ? 'rtl' : 'ltr'
  document.documentElement.lang = code

  if (code === 'en') {
    _revertEnglish()
    return
  }

  if (!_gtReady) {
    _pendingLang = lang.gtCode
    initTranslation()
  } else {
    _doTranslate(lang.gtCode)
  }
}

// ─── Legacy t() — kept for the 3 pages that still use it ─────────────────
const T = {
  en: {
    nav: { dashboard:'Dashboard', analyze:'Analyze', text:'Single Text', history:'History', compare:'Compare', trends:'Trends', tickets:'Support Tickets', verify:'Hash Verify', watchlist:'Watchlist', profile:'Profile' },
    login: { title:'Welcome back', sub:'Sign in to NestInsights', user:'Username', pass:'Password', btn:'Sign In', noAcc:"Don't have an account?", reg:'Register' },
    reg:   { title:'Create Account', sub:'Join NestInsights today', user:'Username', email:'Email', pass:'Password', btn:'Create Account', hasAcc:'Already have an account?', login:'Sign in' },
    common: { analyze:'Analyze', upload:'Upload', loading:'Loading…', export:'Export CSV', delete:'Delete', cancel:'Cancel', save:'Save', search:'Search', back:'Back', total:'Total', positive:'Positive', negative:'Negative', neutral:'Neutral' },
  },
  ur: {
    nav: { dashboard:'ڈیش بورڈ', analyze:'تجزیہ', text:'واحد متن', history:'تاریخ', compare:'موازنہ', trends:'رجحانات', tickets:'ٹکٹس', verify:'ہیش تصدیق', watchlist:'واچ لسٹ', profile:'پروفائل' },
    login: { title:'خوش آمدید', sub:'سائن ان کریں', user:'صارف نام', pass:'پاس ورڈ', btn:'سائن ان', noAcc:'اکاؤنٹ نہیں؟', reg:'رجسٹر' },
    reg:   { title:'اکاؤنٹ بنائیں', sub:'آج شامل ہوں', user:'صارف نام', email:'ای میل', pass:'پاس ورڈ', btn:'اکاؤنٹ بنائیں', hasAcc:'پہلے سے اکاؤنٹ ہے؟', login:'سائن ان' },
    common: { analyze:'تجزیہ', upload:'اپلوڈ', loading:'لوڈ ہو رہا ہے…', export:'CSV برآمد', delete:'حذف', cancel:'منسوخ', save:'محفوظ', search:'تلاش', back:'واپس', total:'کل', positive:'مثبت', negative:'منفی', neutral:'غیر جانبدار' },
  },
  ar: {
    nav: { dashboard:'لوحة القيادة', analyze:'تحليل', text:'نص واحد', history:'السجل', compare:'مقارنة', trends:'الاتجاهات', tickets:'التذاكر', verify:'التحقق', watchlist:'قائمة المراقبة', profile:'الملف الشخصي' },
    login: { title:'مرحباً بعودتك', sub:'تسجيل الدخول', user:'اسم المستخدم', pass:'كلمة المرور', btn:'تسجيل الدخول', noAcc:'ليس لديك حساب؟', reg:'إنشاء حساب' },
    reg:   { title:'إنشاء حساب', sub:'انضم اليوم', user:'اسم المستخدم', email:'البريد الإلكتروني', pass:'كلمة المرور', btn:'إنشاء حساب', hasAcc:'لديك حساب بالفعل؟', login:'تسجيل الدخول' },
    common: { analyze:'تحليل', upload:'رفع', loading:'جارٍ التحميل…', export:'تصدير CSV', delete:'حذف', cancel:'إلغاء', save:'حفظ', search:'بحث', back:'رجوع', total:'المجموع', positive:'إيجابي', negative:'سلبي', neutral:'محايد' },
  },
  fr: {
    nav: { dashboard:'Tableau de bord', analyze:'Analyser', text:'Texte unique', history:'Historique', compare:'Comparer', trends:'Tendances', tickets:'Tickets', verify:'Vérification', watchlist:'Surveillance', profile:'Profil' },
    login: { title:'Bon retour', sub:'Connectez-vous à NestInsights', user:"Nom d'utilisateur", pass:'Mot de passe', btn:'Se connecter', noAcc:'Pas de compte ?', reg:"S'inscrire" },
    reg:   { title:'Créer un compte', sub:'Rejoignez-nous aujourd\'hui', user:"Nom d'utilisateur", email:'E-mail', pass:'Mot de passe', btn:'Créer un compte', hasAcc:'Déjà un compte ?', login:'Se connecter' },
    common: { analyze:'Analyser', upload:'Télécharger', loading:'Chargement…', export:'Exporter CSV', delete:'Supprimer', cancel:'Annuler', save:'Sauvegarder', search:'Rechercher', back:'Retour', total:'Total', positive:'Positif', negative:'Négatif', neutral:'Neutre' },
  },
}

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
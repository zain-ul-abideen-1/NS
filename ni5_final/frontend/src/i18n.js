// ─── Language config ───────────────────────────────────────────────────────
export const LANGS = [
  { code: 'en', gtCode: 'en', label: 'EN',   name: 'English' },
  { code: 'ur', gtCode: 'ur', label: 'اردو', name: 'Urdu'   },
  { code: 'ar', gtCode: 'ar', label: 'عربي', name: 'Arabic' },
  { code: 'fr', gtCode: 'fr', label: 'FR',   name: 'French' },
]

// ─── Hide Google Translate toolbar ────────────────────────────────────────
function _injectHideStyle() {
  if (document.getElementById('gt-hide-style')) return
  const s = document.createElement('style')
  s.id = 'gt-hide-style'
  s.textContent = `
    .goog-te-banner-frame, .goog-te-balloon-frame,
    #goog-gt-tt, .goog-tooltip, .goog-text-highlight,
    .skiptranslate { display: none !important; }
    body { top: 0 !important; }
  `
  document.head.appendChild(s)
}

// ─── Inject hidden GT container once ─────────────────────────────────────
function _ensureContainer() {
  if (document.getElementById('google_translate_element')) return
  const div = document.createElement('div')
  div.id = 'google_translate_element'
  div.style.cssText = 'position:fixed;top:-9999px;left:-9999px;pointer-events:none;'
  document.body.appendChild(div)
}

// ─── Load GT script once ──────────────────────────────────────────────────
let _scriptLoaded = false
function _loadScript(onReady) {
  if (_scriptLoaded) { onReady(); return }
  _scriptLoaded = true
  _ensureContainer()
  window.googleTranslateElementInit = function () {
    new window.google.translate.TranslateElement(
      { pageLanguage: 'en', autoDisplay: false },
      'google_translate_element'
    )
    onReady()
  }
  const sc = document.createElement('script')
  sc.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
  sc.async = true
  document.head.appendChild(sc)
}

// ─── Set googtrans cookie and switch via combo select ─────────────────────
function _setCookie(gtCode) {
  const exp = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString()
  document.cookie = `googtrans=/en/${gtCode}; expires=${exp}; path=/`
  document.cookie = `googtrans=/en/${gtCode}; expires=${exp}; path=/; domain=${location.hostname}`
}

function _clearCookie() {
  const clr = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/'
  document.cookie = clr
  document.cookie = clr + `; domain=${location.hostname}`
}

function _triggerSelect(gtCode) {
  const sel = document.querySelector('.goog-te-combo')
  if (sel) {
    sel.value = gtCode
    sel.dispatchEvent(new Event('change'))
    return true
  }
  return false
}

// ─── Public: called on app init only — NO translation, just prep ──────────
export function initTranslation() {
  _injectHideStyle()
  // Do NOT call applyLanguage here — that causes the reload loop.
  // Just clear any stale googtrans cookie so English loads clean.
  _clearCookie()
}

// ─── Public: called only when user explicitly clicks a language button ────
export function applyLanguage(code) {
  _injectHideStyle()

  // RTL
  document.documentElement.dir = (code === 'ur' || code === 'ar') ? 'rtl' : 'ltr'
  document.documentElement.lang = code

  if (code === 'en') {
    // Revert: clear cookie, use combo select if available, otherwise just reload once
    _clearCookie()
    const reverted = _triggerSelect('en')
    if (!reverted) {
      // Only reload if we're currently translated (googtrans cookie was set before)
      // Check by seeing if goog-te-combo is present (GT was loaded)
      if (document.querySelector('.goog-te-combo')) {
        window.location.reload()
      }
      // If GT was never loaded, we're already in English — do nothing
    }
    return
  }

  // Non-English: set cookie then use select or load script
  _setCookie(code)
  if (_triggerSelect(code)) return

  // Script not loaded yet — load it, then trigger
  _loadScript(() => {
    setTimeout(() => {
      if (!_triggerSelect(code)) {
        // combo still not ready — reload once with cookie set
        window.location.reload()
      }
    }, 800)
  })
}

// ─── Legacy t() — kept for the 3 pages that still call it ────────────────
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
    reg:   { title:'Créer un compte', sub:"Rejoignez-nous aujourd'hui", user:"Nom d'utilisateur", email:'E-mail', pass:'Mot de passe', btn:'Créer un compte', hasAcc:'Déjà un compte ?', login:'Se connecter' },
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
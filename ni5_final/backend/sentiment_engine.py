"""NestInsights v5v — Sentiment Engine with Authenticity Detection & Smart Response Generator"""
import re
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from textblob import TextBlob

vader = SentimentIntensityAnalyzer()

STOPWORDS = set(
    "the a an is was were be been being have has had do does did will would could should "
    "may might shall can i me my we our you your he she it its they them their this that "
    "these those and but or nor so yet both either neither as if when while because since "
    "although though even though after before once until unless where how what who which "
    "whom whose to of in on at by for with about against between through during before after "
    "above below up down out off over under again further then once here there all any both "
    "each few more most other some such no only own same so than too very just get got".split()
)

EMOTION_SEEDS = {
    "joy":           ["happy","joy","love","wonderful","amazing","fantastic","excellent","great","best","perfect","awesome","delight","pleased","thrilled","ecstatic"],
    "anger":         ["angry","furious","terrible","worst","hate","awful","horrible","disgusting","outraged","mad","infuriated","livid","appalled"],
    "fear":          ["scared","afraid","worried","concern","nervous","anxious","panic","dread","frightened","unsafe","uneasy","threatened"],
    "sadness":       ["sad","disappointed","unhappy","depressed","upset","sorry","regret","unfortunate","poor","miserable","heartbroken"],
    "surprise":      ["surprised","shocked","unexpected","unbelievable","wow","astonishing","incredible","sudden","amazed","startled"],
    "disgust":       ["disgusting","gross","repulsive","nauseating","revolting","unacceptable","appalling","offensive","vile"],
    "trust":         ["trust","reliable","honest","safe","secure","dependable","consistent","faithful","genuine","authentic","credible"],
    "anticipation":  ["excited","hope","expect","looking forward","eager","waiting","can't wait","soon","upcoming","anticipate","enthusiastic"],
}

ASPECT_SEEDS = {
    "quality":           ["quality","durable","sturdy","build","material","construction","well made","cheap","flimsy","premium","solid","robust"],
    "price":             ["price","cost","expensive","cheap","affordable","value","worth","overpriced","budget","money","pricing","fee"],
    "delivery":          ["delivery","shipping","arrived","late","fast","slow","courier","dispatch","package","transit","tracking","days to arrive"],
    "customer_service":  ["service","support","staff","helpful","rude","response","customer care","refund","return","exchange","representative","agent"],
    "usability":         ["easy","difficult","use","user","interface","complicated","intuitive","simple","setup","install","configure","navigate"],
    "performance":       ["fast","slow","speed","performance","lag","crash","works","broken","efficient","powerful","responsive","reliable"],
    "appearance":        ["look","design","color","style","beautiful","ugly","attractive","appearance","sleek","aesthetic","nice","pretty"],
    "durability":        ["last","durable","break","broke","sturdy","flimsy","wear","tear","long lasting","fragile","holds up","falls apart"],
}

TOPIC_MAP = {
    "shipping & delivery":   ["ship","deliver","arriv","transit","courier","dispatch","packag","late","fast deliver","tracking"],
    "product quality":       ["quality","material","build","sturdy","durable","premium","cheap","flimsy","well made","construction"],
    "value for money":       ["price","cost","value","worth","expensive","affordable","cheap","budget","overpriced","money"],
    "customer support":      ["support","service","helpful","staff","rude","response","care","refund","return","representative"],
    "user experience":       ["easy","difficult","use","interface","intuitive","simple","complicated","setup","navigate"],
    "product features":      ["feature","function","option","capability","performance","speed","power","battery","screen"],
    "packaging":             ["packag","box","wrap","seal","damaged","intact","open","presentation","unboxing"],
    "recommendation":        ["recommend","suggest","advise","tell friend","buy again","repurchase","worth buying"],
}

SPAM_WORDS = ["buy now","click here","free money","act now","limited offer","winner","prize","earn money","make money fast","guaranteed","risk free","get paid","work from home"]

GENERIC_PRAISE = ["best ever","must buy","highly recommend","perfect product","amazing quality","great product","excellent service","love it","5 stars","wonderful product","best product ever"]

RESPONSE_TEMPLATES = {
    "positive": [
        "Thank you so much for your wonderful feedback! We're thrilled to hear you had a great experience. Your satisfaction means everything to us, and we look forward to serving you again!",
        "We're so glad you enjoyed your experience! Thank you for taking the time to share this — it truly motivates our team. We hope to see you again soon!",
    ],
    "negative": [
        "We sincerely apologize for your experience and understand your frustration. This is not the standard we hold ourselves to. Please contact our support team directly so we can make this right for you.",
        "Thank you for bringing this to our attention. We're truly sorry this happened and want to resolve it immediately. Please reach out to us with your order details so we can provide a solution.",
    ],
    "neutral": [
        "Thank you for your feedback! We appreciate you taking the time to share your thoughts. We're always working to improve and hope to exceed your expectations next time.",
        "Thanks for your honest review! We value all feedback as it helps us grow. We hope your next experience with us will be even better.",
    ],
}

def _extract_keywords(text, top=15):
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    freq = {}
    for w in words:
        if w not in STOPWORDS:
            freq[w] = freq.get(w, 0) + 1
    wlist = [w for w in words if w not in STOPWORDS]
    for i in range(len(wlist) - 1):
        bg = f"{wlist[i]} {wlist[i+1]}"
        freq[bg] = freq.get(bg, 0) + 1
    return sorted([{"word": k, "count": v} for k, v in freq.items()], key=lambda x: -x["count"])[:top]

def _detect_emotions(text):
    tl = text.lower()
    out = {}
    for emotion, seeds in EMOTION_SEEDS.items():
        score = sum(1 for s in seeds if s in tl)
        if score:
            out[emotion] = min(1.0, round(score / 3, 3))
    return out

def _detect_aspects(text):
    tl = text.lower()
    vs = vader.polarity_scores(tl)
    out = {}
    for asp, seeds in ASPECT_SEEDS.items():
        if any(s in tl for s in seeds):
            c = vs["compound"]
            out[asp] = {
                "sentiment": "positive" if c > 0.05 else "negative" if c < -0.05 else "neutral",
                "score": round(c, 3),
            }
    return out

def _detect_topics(text):
    tl = text.lower()
    return [t for t, seeds in TOPIC_MAP.items() if any(s in tl for s in seeds)]

def _helpfulness(text):
    words = text.split()
    wc = len(words)
    score = 0.0
    if 20 <= wc <= 150:     score += 0.35
    elif wc > 150:           score += 0.2
    elif wc >= 10:           score += 0.1
    specifics = ["because","however","although","but","specifically","especially","compared","issue","problem","feature","quality","delivery","price","worth","honestly","though","despite","actually"]
    score += min(0.3, sum(0.05 for s in specifics if s in text.lower()))
    if any(c.isdigit() for c in text): score += 0.1
    sents = [s.strip() for s in re.split(r'[.!?]', text) if s.strip()]
    if len(sents) >= 3: score += 0.1
    spam_penalty = sum(0.1 for w in SPAM_WORDS if w in text.lower())
    caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
    if caps_ratio > 0.4: score -= 0.15
    score = max(0.0, min(1.0, score - spam_penalty))
    if score >= 0.65:   label = "very helpful"
    elif score >= 0.4:  label = "helpful"
    elif score >= 0.2:  label = "somewhat helpful"
    else:               label = "not helpful"
    return round(score, 3), label

def _spam_score(text):
    tl = text.lower()
    score = 0.0
    score += min(0.5, sum(0.15 for w in SPAM_WORDS if w in tl))
    if len(text.split()) < 4: score += 0.3
    caps = sum(1 for c in text if c.isupper())
    if len(text) > 0 and caps / len(text) > 0.5: score += 0.25
    if re.search(r'(.)\1{4,}', text): score += 0.2
    return min(1.0, round(score, 3))

def _authenticity(text):
    tl = text.lower()
    words = text.split()
    suspicion = 0.0
    if len(words) < 5: suspicion += 0.35
    pos_words = sum(1 for w in ["amazing","perfect","best","excellent","fantastic","wonderful","awesome","love","outstanding","superb"] if w in tl)
    specific_words = sum(1 for w in ["because","however","quality","delivery","size","color","material","battery","screen","feature","issue","problem","days","week"] if w in tl)
    if pos_words >= 3 and specific_words == 0: suspicion += 0.35
    suspicion += min(0.3, sum(0.1 for p in GENERIC_PRAISE if p in tl))
    sents = [s.strip() for s in re.split(r'[.!?]', text) if s.strip()]
    if len(sents) > 1:
        unique = len(set(s.lower()[:30] for s in sents))
        if unique < len(sents): suspicion += 0.2
    caps_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
    if caps_ratio > 0.35: suspicion += 0.15
    auth_score = max(0.0, min(1.0, round(1.0 - suspicion, 3)))
    if auth_score >= 0.75:   label = "genuine"
    elif auth_score >= 0.5:  label = "likely genuine"
    elif auth_score >= 0.3:  label = "suspicious"
    else:                     label = "likely fake"
    return auth_score, label

def _suggest_response(sentiment):
    import random
    templates = RESPONSE_TEMPLATES.get(sentiment, RESPONSE_TEMPLATES["neutral"])
    return random.choice(templates)

def _rule_based_override(text: str) -> float:
    """
    Rule-based sentiment correction layer.
    Returns an adjustment to add to compound score.
    Fixes VADER/TextBlob failures on complex positive sentences.
    """
    tl = text.lower()
    adjustment = 0.0

    # Strong positive phrases — if ANY of these are present, strongly boost positive
    strong_positive = [
        "pleasant experience", "great experience", "wonderful experience", "amazing experience",
        "excellent experience", "love it", "love the", "highly recommend", "very helpful",
        "so helpful", "extremely helpful", "incredibly helpful", "very kind", "so kind",
        "thank you", "thankyou", "grateful", "cannot express", "express enough",
        "highest level", "professionalism", "truly appreciate", "best", "outstanding",
        "exceeded", "exceeded my expectations", "well done", "great job", "fantastic",
        "very pleased", "very happy", "very satisfied", "extremely satisfied",
        "don't get aggravated", "do not get aggravated", "not get aggravated",
        "patient", "patience", "understanding", "compassionate", "caring",
        "i always have", "always have a", "pleasant", "enjoy", "enjoyed",
        "appreciate", "appreciated", "impressed", "delighted", "glad",
    ]
    for phrase in strong_positive:
        if phrase in tl:
            adjustment += 0.25
            break  # one match is enough for a big boost

    # Explicit negative phrases — only penalize for these, not ambiguous words
    strong_negative = [
        "terrible experience", "worst experience", "horrible experience",
        "very disappointed", "extremely disappointed", "totally disappointed",
        "complete waste", "waste of money", "never buy again", "never again",
        "scam", "fraud", "broken", "stopped working", "doesn't work", "does not work",
        "refund", "return this", "very bad", "very poor", "absolutely terrible",
        "absolutely horrible", "awful", "disgusting service", "rude staff",
        "rude employee", "not satisfied", "completely wrong", "damaged",
    ]
    neg_count = sum(1 for phrase in strong_negative if phrase in tl)
    adjustment -= neg_count * 0.3

    return max(-0.8, min(0.8, adjustment))


def analyze_review(text: str, original_text: str = None) -> dict:
    if not text or not text.strip():
        return {}
    t = text.strip()
    vs = vader.polarity_scores(t)
    tb = TextBlob(t)
    tb_pol = tb.sentiment.polarity

    # VADER is far more reliable than TextBlob for reviews.
    # TextBlob fails badly on complex sentences (gives -0.94 on clearly positive text).
    # Use VADER as primary (85%), TextBlob only as minor secondary (15%).
    # Then apply rule-based correction for known VADER failure patterns.
    compound = vs["compound"] * 0.85 + tb_pol * 0.15

    # Apply rule-based correction to fix remaining misclassifications
    correction = _rule_based_override(t)
    compound = max(-1.0, min(1.0, compound + correction))

    if compound > 0.05:
        sentiment, pos_p, neg_p, neu_p = "positive", min(0.99, 0.65 + compound * 0.3), 0.1, max(0.01, 0.25 - compound * 0.1)
    elif compound < -0.05:
        sentiment, pos_p, neg_p, neu_p = "negative", 0.1, min(0.99, 0.65 + abs(compound) * 0.3), max(0.01, 0.25 - abs(compound) * 0.1)
    else:
        sentiment, pos_p, neg_p, neu_p = "neutral", 0.3, 0.3, 0.4
    confidence = min(0.99, 0.55 + abs(compound) * 0.4)
    hs, hl = _helpfulness(t)
    auth_score, auth_label = _authenticity(t)
    from database import hash_text
    return {
        "text": t,
        "original_text": original_text or t,
        "sentiment": sentiment,
        "score": round(compound, 4),
        "confidence": round(confidence, 4),
        "positive_prob": round(pos_p, 4),
        "negative_prob": round(neg_p, 4),
        "neutral_prob":  round(neu_p, 4),
        "subjectivity":  round(tb.sentiment.subjectivity, 4),
        "vader_compound": round(vs["compound"], 4),
        "helpfulness_score":  hs,
        "helpfulness_label":  hl,
        "spam_score":         _spam_score(t),
        "authenticity_score": auth_score,
        "authenticity_label": auth_label,
        "emotions":  _detect_emotions(t),
        "aspects":   _detect_aspects(t),
        "topics":    _detect_topics(t),
        "keywords":  _extract_keywords(t),
        "response_suggestion": _suggest_response(sentiment),
        "hash_value": hash_text(t),
    }

def batch_analyze(texts):
    return [analyze_review(t) for t in texts if t and str(t).strip()]

def summary_stats(results):
    if not results:
        return {}
    total = len(results)
    pos = sum(1 for r in results if r.get("sentiment") == "positive")
    neg = sum(1 for r in results if r.get("sentiment") == "negative")
    neu = total - pos - neg
    scores     = [r.get("score", 0) for r in results]
    helps      = [r.get("helpfulness_score", 0) for r in results]
    auths      = [r.get("authenticity_score", 1) for r in results]
    spam_list  = [r.get("spam_score", 0) for r in results]
    fake_count = sum(1 for r in results if r.get("authenticity_label") in ("suspicious", "likely fake"))
    all_topics   = {}
    all_keywords = {}
    emotion_totals = {}
    aspect_totals  = {}
    for r in results:
        for tp in r.get("topics", []):
            all_topics[tp] = all_topics.get(tp, 0) + 1
        for k in r.get("keywords", []):
            w = k["word"]
            all_keywords[w] = all_keywords.get(w, 0) + k["count"]
        for e, v in r.get("emotions", {}).items():
            emotion_totals[e] = emotion_totals.get(e, 0) + v
        for a, d in r.get("aspects", {}).items():
            if a not in aspect_totals:
                aspect_totals[a] = {"positive": 0, "negative": 0, "neutral": 0}
            aspect_totals[a][d["sentiment"]] += 1
    top_topics   = dict(sorted(all_topics.items(),   key=lambda x: -x[1])[:10])
    top_keywords = sorted([{"word": k, "count": v} for k, v in all_keywords.items()], key=lambda x: -x["count"])[:25]
    # Sentiment trend (first half vs second half)
    half = max(1, total // 2)
    first_avg  = sum(r.get("score", 0) for r in results[:half]) / half
    second_avg = sum(r.get("score", 0) for r in results[half:]) / max(1, total - half)
    trend = "improving" if second_avg > first_avg + 0.05 else "declining" if second_avg < first_avg - 0.05 else "stable"
    return {
        "total": total, "positive": pos, "negative": neg, "neutral": neu,
        "positive_pct": round(pos / total * 100, 1),
        "negative_pct": round(neg / total * 100, 1),
        "neutral_pct":  round(neu / total * 100, 1),
        "avg_score":         round(sum(scores) / total, 4),
        "avg_helpfulness":   round(sum(helps) / total, 4),
        "avg_authenticity":  round(sum(auths) / total, 4),
        "avg_spam":          round(sum(spam_list) / total, 4),
        "fake_count":        fake_count,
        "fake_pct":          round(fake_count / total * 100, 1),
        "top_topics":        top_topics,
        "top_keywords":      top_keywords,
        "emotion_totals":    emotion_totals,
        "aspect_totals":     aspect_totals,
        "sentiment_trend":   trend,
        "first_half_score":  round(first_avg, 4),
        "second_half_score": round(second_avg, 4),
    }
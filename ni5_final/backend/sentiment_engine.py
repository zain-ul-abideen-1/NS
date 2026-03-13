"""
NestInsights — Professional Sentiment Engine
Combines VADER + Domain-Aware Lexicon for accurate sentiment analysis.
Correctly handles:
  - "highest level of professionalism" -> POSITIVE
  - "highest level of rudeness"        -> NEGATIVE
  - "lack of professionalism"          -> NEGATIVE
  - Negation, amplification, mixed sentiment
"""

import re
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_vader = SentimentIntensityAnalyzer()

_NEG_NOUNS = {
    "rudeness","rude","arrogance","arrogant","incompetence","incompetent",
    "laziness","lazy","dishonesty","dishonest","negligence","negligent",
    "ignorance","ignorant","disrespect","disrespectful","hostility","hostile",
    "aggression","aggressive","unprofessionalism","unprofessional",
    "deception","deceitful","fraud","fraudulent","useless","uselessness",
    "carelessness","careless","inefficiency","inefficient","unreliable",
    "unreliability","horrible","terrible","awful","disgusting","appalling",
    "atrocious","mediocre","mediocrity","disappointment","failure","failures",
    "scam","theft","lies","lying","manipulation","bullying",
    "harassment","abuse","mistreatment","discrimination","ineptitude","inept",
    "condescension","condescending","dismissiveness","dismissive",
    "indifference","indifferent","incompetency","insult","insulting","abusive",
}

_POS_NOUNS = {
    "professionalism","professional","excellence","excellent",
    "helpfulness","helpful","kindness","kind","patience","patient",
    "expertise","expert","dedication","dedicated","commitment","committed",
    "efficiency","efficient","reliability","reliable","consistency","consistent",
    "support","care","caring","attentive","attentiveness",
    "competence","competent","skill","skilled","service",
    "courtesy","courteous","warmth","warm","responsive","responsiveness",
    "integrity","honest","honesty","transparency","accuracy",
    "diligence","diligent","thoroughness","thorough","proficiency","proficient",
    "empathy","empathetic","understanding","considerate","thoughtful",
    "friendliness","friendly","approachable","welcoming",
}

_NEGATORS = {
    "not","no","never","without","lack","lacking","zero","none",
    "hardly","barely","absence","absent","devoid",
}

_AMPLIFIERS = {
    "highest","greatest","utmost","complete","absolute","total",
    "utter","extreme","sheer","maximum","ultimate","profound",
    "incredible","remarkable","exceptional",
}


def _domain_score(text: str) -> float:
    tl = text.lower()
    tokens = re.findall(r'\b\w+\b', tl)
    score = 0.0
    n = len(tokens)
    for i, word in enumerate(tokens):
        window = tokens[max(0, i-4):i]
        negated   = any(neg in window for neg in _NEGATORS)
        amplified = any(amp in window for amp in _AMPLIFIERS)
        weight = 1.6 if amplified else 1.0
        if word in _POS_NOUNS:
            score += (-weight * 1.4) if negated else (weight * 1.4)
        elif word in _NEG_NOUNS:
            score += (weight * 1.4) if negated else (-weight * 1.4)
    if n == 0:
        return 0.0
    return max(-1.0, min(1.0, score / (n ** 0.5)))


def _blend(vader_score: float, domain_score: float) -> float:
    if abs(domain_score) > 0.20:
        blended = domain_score * 0.72 + vader_score * 0.28
    elif abs(domain_score) > 0.08:
        blended = domain_score * 0.50 + vader_score * 0.50
    else:
        blended = vader_score * 0.90 + domain_score * 0.10
    return max(-1.0, min(1.0, blended))


def _label(score: float) -> str:
    if score >= 0.12:   return "positive"
    elif score <= -0.12: return "negative"
    else:               return "neutral"


def get_sentiment(text: str) -> dict:
    if not text or not text.strip():
        return {"sentiment":"neutral","score":0.0,"positive_prob":0.33,"negative_prob":0.33,"neutral_prob":0.34,"confidence":0.5}
    t = text.strip()
    vs   = _vader.polarity_scores(t)
    v    = vs["compound"]
    d    = _domain_score(t)
    final = _blend(v, d)
    sentiment = _label(final)
    raw_pos = max(0.0, final)
    raw_neg = max(0.0, -final)
    raw_neu = 1.0 - abs(final)
    total = raw_pos + raw_neg + raw_neu + 1e-9
    confidence = min(0.99, abs(final) * 0.7 + 0.3)
    if (d > 0 and v > 0) or (d < 0 and v < 0):
        confidence = min(0.99, confidence + 0.08)
    return {
        "sentiment":      sentiment,
        "score":          round(final, 4),
        "positive_prob":  round(raw_pos/total, 4),
        "negative_prob":  round(raw_neg/total, 4),
        "neutral_prob":   round(raw_neu/total, 4),
        "confidence":     round(confidence, 4),
        "vader_compound": round(v, 4),
        "domain_score":   round(d, 4),
    }


def analyze_review(text: str) -> dict:
    return get_sentiment(text)
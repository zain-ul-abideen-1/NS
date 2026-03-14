"""
NestInsights — Professional Sentiment Engine
VADER + Domain-Aware Lexicon + Financial/Medical domain corrections.

Handles correctly:
 - "refinance debt at lower rate"        -> POSITIVE (financial positive context)
 - "highest level of professionalism"    -> POSITIVE
 - "highest level of rudeness"           -> NEGATIVE  
 - "lack of professionalism"             -> NEGATIVE
 - Negation, amplification, mixed text
"""
import re
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

_vader = SentimentIntensityAnalyzer()

# ── Domain Lexicons ───────────────────────────────────────────────
_NEG_DOMAIN = {
    "rudeness","rude","arrogance","arrogant","incompetence","incompetent",
    "laziness","dishonesty","dishonest","negligence","negligent",
    "disrespect","disrespectful","hostility","hostile","aggression","aggressive",
    "unprofessionalism","unprofessional","deception","deceitful","fraud","fraudulent",
    "useless","carelessness","careless","inefficiency","inefficient","unreliable",
    "horrible","terrible","awful","disgusting","appalling","atrocious",
    "mediocre","failure","failures","scam","lies","lying","manipulation",
    "harassment","abuse","mistreatment","ineptitude","inept",
    "condescension","condescending","dismissive","indifference","indifferent",
    "insult","insulting","abusive","offensive","disappointment",
}

_POS_DOMAIN = {
    "professionalism","professional","excellence","excellent",
    "helpfulness","helpful","kindness","kind","patience","patient",
    "expertise","expert","dedication","dedicated","commitment","committed",
    "efficiency","efficient","reliability","reliable","consistency","consistent",
    "support","care","caring","attentive","attentiveness",
    "competence","competent","skill","skilled","courtesy","courteous",
    "warmth","warm","responsive","responsiveness","integrity","honest",
    "honesty","transparency","diligence","diligent","thoroughness","thorough",
    "empathy","empathetic","understanding","considerate","thoughtful",
    "friendliness","friendly","approachable","welcoming","exceptional",
}

# Words VADER wrongly penalizes in positive financial/medical context
_FINANCIAL_POS_PHRASES = [
    "lower rate", "lower interest", "lower monthly", "reduced rate",
    "pay off", "paid off", "paying off", "pays off",
    "refinance", "refinanced", "refinancing",
    "consolidate", "consolidated", "consolidation",
    "debt free", "debt paid", "clear debt", "cleared debt",
    "funds appeared", "funds deposited", "funds received", "cash next day",
    "approved quickly", "fast approval", "instant approval",
    "lower payment", "reduced payment", "manageable payment",
    "creditors paid", "pay creditors", "paid creditors",
    "saved money", "saving money", "saves money",
]

_NEGATORS  = {"not","no","never","without","lack","lacking","zero","none","hardly","barely","absence","absent","devoid"}
_AMPLIFIERS= {"highest","greatest","utmost","complete","absolute","total","utter","extreme","sheer","maximum","ultimate","profound","incredible","remarkable","exceptional"}


def _financial_correction(text: str) -> float:
    """Return positive boost if text contains financial positive phrases."""
    tl = text.lower()
    boost = sum(0.15 for phrase in _FINANCIAL_POS_PHRASES if phrase in tl)
    return min(0.60, boost)


def _domain_score(text: str) -> float:
    tokens = re.findall(r'\b\w+\b', text.lower())
    score = 0.0
    for i, word in enumerate(tokens):
        window   = tokens[max(0, i-4):i]
        negated  = any(n in window for n in _NEGATORS)
        amplified= any(a in window for a in _AMPLIFIERS)
        weight   = 1.6 if amplified else 1.0
        if word in _POS_DOMAIN:
            score += (-weight*1.4) if negated else (weight*1.4)
        elif word in _NEG_DOMAIN:
            score += (weight*1.4)  if negated else (-weight*1.4)
    n = len(tokens)
    return max(-1.0, min(1.0, score / (n**0.5))) if n > 0 else 0.0


def _blend(vader: float, domain: float, financial_boost: float) -> float:
    # Apply financial boost to raw VADER score before blending
    v_corrected = min(1.0, vader + financial_boost)
    if abs(domain) > 0.20:
        blended = domain * 0.72 + v_corrected * 0.28
    elif abs(domain) > 0.08:
        blended = domain * 0.50 + v_corrected * 0.50
    else:
        blended = v_corrected * 0.90 + domain * 0.10
    return max(-1.0, min(1.0, blended))


def _label(score: float) -> str:
    if   score >= 0.05: return "positive"
    elif score <= -0.10: return "negative"
    else:               return "neutral"


def get_sentiment(text: str) -> dict:
    if not text or not text.strip():
        return {"sentiment":"neutral","score":0.0,"positive_prob":0.33,"negative_prob":0.33,"neutral_prob":0.34,"confidence":0.5}
    t = text.strip()
    v  = _vader.polarity_scores(t)["compound"]
    d  = _domain_score(t)
    fb = _financial_correction(t)
    final = _blend(v, d, fb)
    sentiment = _label(final)
    raw_pos = max(0.0, final)
    raw_neg = max(0.0, -final)
    raw_neu = 1.0 - abs(final)
    total   = raw_pos + raw_neg + raw_neu + 1e-9
    confidence = min(0.99, abs(final)*0.7 + 0.3)
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
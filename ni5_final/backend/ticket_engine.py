"""NestInsights v5 — Customer Support Ticket Classification Engine"""
import re

# Pure rule-based sentiment — no external NLP deps needed
_POS_WORDS = set("good great excellent amazing wonderful fantastic love loved perfect happy pleased satisfied awesome brilliant outstanding superb thank thanks appreciated helpful working fixed resolved quick fast easy smooth".split())
_NEG_WORDS = set("bad terrible awful horrible worst hate hated broken failed error crash bug slow problem issue wrong missing damaged defective disappointed frustrating angry upset useless terrible poor worst never refund".split())

def _simple_sentiment(text):
    words = text.lower().split()
    pos = sum(1 for w in words if w in _POS_WORDS)
    neg = sum(1 for w in words if w in _NEG_WORDS)
    score = (pos - neg) / max(len(words), 1) * 5
    if score > 0.05:   return "positive", round(score, 4)
    elif score < -0.05: return "negative", round(score, 4)
    else:               return "neutral",  round(score, 4)

STOPWORDS = set("the a an is was were be been have has had do does did will would could should i me my we you your he she it its they them this that and but or so yet for to of in on at by with".split())

CATEGORIES = {
    "Technical Issue": {
        "keywords": ["error","bug","crash","not working","broken","glitch","fail","freeze","slow","cant login","login issue","password reset","404","500","technical","install","update","upgrade","not loading","blank screen","keeps crashing","app not opening","wont start","corrupted","database"],
        "subcategories": ["Login/Auth", "Performance", "App Crash", "Data Error", "Integration Issue"],
        "sla_hours": 4,
        "color": "#6C63FF",
    },
    "Billing / Payment": {
        "keywords": ["payment","billing","charge","invoice","receipt","refund","money","transaction","credit card","debit","subscription","fee","cost","overcharged","double charge","fraud","unauthorized charge","wrong amount","payment failed","card declined","billing error"],
        "subcategories": ["Overcharge", "Payment Failed", "Subscription", "Invoice Issue", "Refund Request"],
        "sla_hours": 2,
        "color": "#FFB347",
    },
    "Refund / Return": {
        "keywords": ["refund","return","exchange","money back","cancel","cancellation","dispute","chargeback","wrong item","damaged","defective","replace","not as described","quality issue","broken on arrival","want my money"],
        "subcategories": ["Damaged Product", "Wrong Item", "Quality Issue", "Cancellation", "Exchange"],
        "sla_hours": 6,
        "color": "#FF6584",
    },
    "Delivery / Shipping": {
        "keywords": ["delivery","shipping","shipped","arrived","late","missing","lost","package","tracking","courier","dispatch","address","wrong address","not delivered","still waiting","where is my order","delayed shipment","returned to sender","customs","import"],
        "subcategories": ["Late Delivery", "Missing Package", "Wrong Address", "Customs/Import", "Damaged in Transit"],
        "sla_hours": 8,
        "color": "#43E97B",
    },
    "Account / Login": {
        "keywords": ["account","login","sign in","password","username","access","locked","suspended","banned","profile","email","verify","otp","two factor","2fa","cant access","forgot password","account disabled","account deleted","merge accounts","change email"],
        "subcategories": ["Password Reset", "Account Locked", "2FA Issue", "Profile Update", "Account Deletion"],
        "sla_hours": 2,
        "color": "#8B85FF",
    },
    "Feature Request": {
        "keywords": ["feature","suggestion","request","improve","add","would be nice","should have","wish","recommend","enhancement","idea","feedback","update","new feature","would love","please add","could you add","missing feature","need ability"],
        "subcategories": ["UI/UX", "New Feature", "Integration", "API", "Performance Enhancement"],
        "sla_hours": 72,
        "color": "#6EE7B7",
    },
    "Complaint / Abuse": {
        "keywords": ["complaint","rude","unprofessional","harassment","abuse","scam","fraud","misleading","lie","cheated","unacceptable","terrible service","worst experience","never using","legal action","report","disgusting behavior","threatening"],
        "subcategories": ["Staff Behavior", "Misleading Info", "Policy Violation", "Harassment", "Escalation"],
        "sla_hours": 1,
        "color": "#F87171",
    },
    "Spam / Irrelevant": {
        "keywords": ["buy now","click here","win prize","lottery","free money","earn online","get rich","investment opportunity","discount code for other","unsubscribe","test","hello","asdf"],
        "subcategories": ["Spam", "Test Ticket", "Wrong Department", "Duplicate"],
        "sla_hours": 168,
        "color": "#94A3B8",
    },
}

PRIORITY_KEYWORDS = {
    "critical": ["urgent","immediately","asap","right now","emergency","critical","cannot work","system down","data loss","security breach","fraud","legal","lawsuit","threatening","escalate to ceo","media","going to sue","all my data","production down"],
    "high":     ["important","frustrated","angry","disappointed","broken","not working","serious","major","significant","days waiting","week waiting","unacceptable","still not fixed"],
    "medium":   ["issue","problem","error","concern","question","need help","please fix","not ideal","hoping","could you"],
    "low":      ["suggestion","idea","improvement","feature request","minor","small","would be nice","feedback","just wondering","curious","when will"],
}

RESPONSES = {
    "Technical Issue":    "Hi {name},\n\nThank you for contacting us about this technical issue. We sincerely apologize for the inconvenience.\n\nOur engineering team has been notified and is investigating immediately. We will provide you with an update within {sla} hours.\n\nIn the meantime, please try: 1) Clearing cache/cookies, 2) Using a different browser, 3) Restarting the application.\n\nIf the issue persists, please reply with any error messages or screenshots.\n\nBest regards,\nNestInsights Support",
    "Billing / Payment":  "Hi {name},\n\nThank you for reaching out regarding your billing concern. We understand how stressful payment issues can be.\n\nOur billing team will review your account and transaction history immediately. We will respond within {sla} hours with a full resolution.\n\nPlease have your order/transaction ID ready for reference.\n\nBest regards,\nNestInsights Support",
    "Refund / Return":    "Hi {name},\n\nThank you for contacting us. We're sorry to hear your experience didn't meet expectations.\n\nWe've initiated a review of your case. Our team will process your request within {sla} hours and confirm next steps via email.\n\nPlease keep the item in its original condition if possible.\n\nBest regards,\nNestInsights Support",
    "Delivery / Shipping":"Hi {name},\n\nThank you for reaching out about your delivery. We apologize for any delay or inconvenience.\n\nWe've contacted our logistics team to investigate the status of your shipment. You'll receive an update within {sla} hours.\n\nYour tracking number: [Will be provided]\n\nBest regards,\nNestInsights Support",
    "Account / Login":    "Hi {name},\n\nThank you for contacting us. We've received your account access request.\n\nFor security reasons, please verify your identity by replying with: 1) Registered email address, 2) Last 4 digits of payment method on file.\n\nWe'll restore your access within {sla} hours.\n\nBest regards,\nNestInsights Support",
    "Feature Request":    "Hi {name},\n\nThank you so much for your valuable suggestion! We truly appreciate customers who help us improve.\n\nYour feature request has been logged and shared with our product team. While we can't guarantee a timeline, we do review all suggestions regularly.\n\nWe'll notify you if this feature is added in a future update.\n\nBest regards,\nNestInsights Support",
    "Complaint / Abuse":  "Hi {name},\n\nWe sincerely apologize for the experience you described. This is absolutely not acceptable and does not reflect our values.\n\nThis matter has been escalated to our senior management team immediately. We will contact you within {sla} hour(s) with a personal response and resolution.\n\nThank you for bringing this to our attention.\n\nBest regards,\nNestInsights Support",
    "Spam / Irrelevant":  "Hi,\n\nThank you for contacting NestInsights Support. If you reached us by mistake, no action is needed.\n\nIf you have a genuine question, please reply with more details and we'd be happy to help.\n\nBest regards,\nNestInsights Support",
}

def _get_sla_label(hours: int) -> str:
    if hours <= 1:   return "< 1 hour"
    elif hours <= 4: return f"{hours} hours"
    elif hours <= 24: return f"{hours} hours (same day)"
    elif hours <= 72: return f"{hours//24} business days"
    else:             return "1 week"

def classify_ticket(text: str, customer_name: str = "Customer") -> dict:
    if not text or not text.strip():
        return {}
    t = text.strip()
    tl = t.lower()

    # Category scoring
    cat_scores = {}
    for cat, info in CATEGORIES.items():
        score = sum(1 for kw in info["keywords"] if kw in tl)
        if score:
            cat_scores[cat] = score
    category = max(cat_scores, key=cat_scores.get) if cat_scores else "Technical Issue"
    cat_info = CATEGORIES[category]

    # Subcategory
    subcategory = cat_info["subcategories"][0]

    # Priority
    priority = "medium"
    for p, keywords in PRIORITY_KEYWORDS.items():
        if any(kw in tl for kw in keywords):
            priority = p
            break

    # Escalate flag
    escalate = priority == "critical" or category == "Complaint / Abuse"

    # Sentiment — pure rule-based, no external deps
    sentiment, compound = _simple_sentiment(t)

    # Urgency
    urgency = {"critical": 0.95, "high": 0.75, "medium": 0.50, "low": 0.20}[priority]
    if sentiment == "negative": urgency = min(1.0, urgency + 0.1)
    if escalate:               urgency = min(1.0, urgency + 0.1)

    # SLA
    sla_hours = cat_info["sla_hours"]
    if priority == "critical": sla_hours = max(1, sla_hours // 4)
    elif priority == "high":   sla_hours = max(2, sla_hours // 2)

    # Keywords
    words = re.findall(r'\b[a-zA-Z]{3,}\b', tl)
    freq = {}
    for w in words:
        if w not in STOPWORDS:
            freq[w] = freq.get(w, 0) + 1
    keywords = sorted([{"word": k, "count": v} for k, v in freq.items()], key=lambda x: -x["count"])[:10]

    # Extract entities (order IDs, emails, phone numbers)
    entities = []
    order_ids = re.findall(r'(?:order|#|id|ticket)[:\s#]*([A-Z0-9]{6,15})', t, re.I)
    emails    = re.findall(r'[\w.-]+@[\w.-]+\.\w+', t)
    phones    = re.findall(r'[\+\d][\d\s\-\(\)]{9,15}', t)
    if order_ids: entities.append({"type": "order_id", "values": order_ids})
    if emails:    entities.append({"type": "email",    "values": emails})
    if phones:    entities.append({"type": "phone",    "values": phones})

    # Suggested response
    response = RESPONSES.get(category, RESPONSES["Technical Issue"])
    response = response.replace("{name}", customer_name).replace("{sla}", _get_sla_label(sla_hours))

    from database import hash_text
    return {
        "text": t,
        "original_text": t,
        "category": category,
        "subcategory": subcategory,
        "priority": priority,
        "sentiment": sentiment,
        "score": round(compound, 4),
        "urgency_score": round(urgency, 3),
        "escalate": escalate,
        "sla_hours": sla_hours,
        "sla_label": _get_sla_label(sla_hours),
        "suggested_action": f"Assign to {category} team. SLA: {_get_sla_label(sla_hours)}. {'⚠️ ESCALATE TO MANAGEMENT' if escalate else 'Standard response.'}",
        "suggested_response": response,
        "keywords": keywords,
        "entities": entities,
        "category_scores": dict(sorted(cat_scores.items(), key=lambda x: -x[1])),
        "category_color": cat_info["color"],
        "hash_value": hash_text(t),
    }

def batch_classify(texts, customer_name="Customer"):
    return [classify_ticket(t, customer_name) for t in texts if t and str(t).strip()]

def ticket_summary(results):
    if not results:
        return {}
    total = len(results)
    cats  = {}
    pris  = {}
    sents = {}
    for r in results:
        c = r.get("category", "Unknown")
        p = r.get("priority", "medium")
        s = r.get("sentiment", "neutral")
        cats[c]  = cats.get(c, 0) + 1
        pris[p]  = pris.get(p, 0) + 1
        sents[s] = sents.get(s, 0) + 1
    avg_urgency   = sum(r.get("urgency_score", 0) for r in results) / total
    critical_count = sum(1 for r in results if r.get("priority") == "critical")
    high_count     = sum(1 for r in results if r.get("priority") == "high")
    escalate_count = sum(1 for r in results if r.get("escalate"))
    neg_count      = sum(1 for r in results if r.get("sentiment") == "negative")
    top_category   = max(cats, key=cats.get) if cats else "N/A"
    return {
        "total": total,
        "category_breakdown": cats,
        "priority_breakdown": pris,
        "sentiment_breakdown": sents,
        "avg_urgency":     round(avg_urgency, 3),
        "critical_count":  critical_count,
        "high_count":      high_count,
        "escalate_count":  escalate_count,
        "negative_count":  neg_count,
        "critical_pct":    round(critical_count / total * 100, 1),
        "escalate_pct":    round(escalate_count / total * 100, 1),
        "top_category":    top_category,
        "needs_attention": critical_count + high_count,
    } 
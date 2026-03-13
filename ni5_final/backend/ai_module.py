"""NestInsights v5 — AI Module
Anthropic Claude primary + intelligent rule-based fallbacks that use ACTUAL review content.
"""
import os, re, random

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

def _call_claude(prompt: str, system: str = "", max_tokens: int = 600) -> str | None:
    if not ANTHROPIC_API_KEY:
        return None
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        r = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=max_tokens,
            system=system or (
                "You are NestInsights AI — a senior consumer intelligence analyst. "
                "Be concise, data-driven, give specific actionable recommendations. "
                "Format: short paragraphs, no bullet lists, no markdown headers."
            ),
            messages=[{"role": "user", "content": prompt}],
        )
        return r.content[0].text if r.content else None
    except Exception as e:
        err = str(e).lower()
        if "api_key" in err or "authentication" in err or "unauthorized" in err:
            return "__INVALID_KEY__"
        return None


# ─────────────────────────────────────────────────────────────
# INTELLIGENT RULE-BASED REPLY ENGINE
# Reads actual review content and builds context-aware responses
# ─────────────────────────────────────────────────────────────

def _extract_review_issues(text: str) -> list:
    """Extract specific issues mentioned in a review."""
    text_lower = text.lower()
    issues = []
    patterns = {
        "delivery": ["delivery", "shipping", "arrived late", "delayed", "never arrived", "still waiting", "tracking"],
        "quality": ["quality", "broke", "broken", "defective", "poor quality", "cheaply made", "fell apart", "stopped working"],
        "customer_service": ["customer service", "support", "ignored", "no response", "unhelpful", "rude", "dismissive"],
        "packaging": ["packaging", "damaged box", "arrived damaged", "poorly packed", "crushed"],
        "wrong_item": ["wrong item", "incorrect", "not what i ordered", "different from", "not as described"],
        "refund": ["refund", "money back", "return", "reimbursement", "charge"],
        "price": ["overpriced", "expensive", "not worth", "waste of money", "rip off"],
        "sizing": ["sizing", "size", "too big", "too small", "doesn't fit", "wrong size"],
        "installation": ["install", "setup", "difficult to", "hard to", "confusing", "instructions"],
    }
    for issue_type, keywords in patterns.items():
        if any(kw in text_lower for kw in keywords):
            issues.append(issue_type)
    return issues

def _extract_positives(text: str) -> list:
    """Extract specific positives from a review."""
    text_lower = text.lower()
    positives = []
    patterns = {
        "fast_delivery": ["fast delivery", "quick shipping", "arrived quickly", "shipped fast", "on time"],
        "great_quality": ["great quality", "excellent quality", "high quality", "well made", "sturdy", "durable"],
        "good_price": ["good price", "great value", "worth the money", "affordable", "reasonable price"],
        "good_service": ["great service", "helpful staff", "responsive", "excellent support", "customer service was"],
        "looks_good": ["looks great", "beautiful", "stylish", "attractive", "love the design", "looks exactly"],
        "easy_to_use": ["easy to use", "simple", "user friendly", "intuitive", "straightforward"],
        "exceeded_expectations": ["exceeded", "better than expected", "surpassed", "impressed"],
    }
    for p_type, keywords in patterns.items():
        if any(kw in text_lower for kw in keywords):
            positives.append(p_type)
    return positives

def _get_tone_style(tone: str) -> dict:
    """Return tone-specific language elements."""
    styles = {
        "professional": {
            "opener": ["Thank you for your valued feedback.", "We appreciate you taking the time to share this.", "Thank you for bringing this to our attention."],
            "closer": ["We look forward to serving you again.", "We remain committed to your satisfaction.", "Please don't hesitate to reach out."],
            "apology": "We sincerely apologize for this experience.",
            "resolution": "Our team will address this immediately.",
            "gratitude": "We genuinely appreciate your positive review."
        },
        "friendly": {
            "opener": ["Hey, thanks so much for the feedback!", "Oh wow, thank you for sharing this!", "Hi there! We really appreciate you taking the time to write this."],
            "closer": ["Hope to see you again soon! 😊", "Thanks again, you're awesome!", "Can't wait to serve you again!"],
            "apology": "We're so sorry this happened – that's definitely not the experience we want for you!",
            "resolution": "We're on it right away!",
            "gratitude": "This honestly made our day! Thank you so much! 🙌"
        },
        "empathetic": {
            "opener": ["We hear you, and we truly understand how frustrating this must have been.", "Your feelings are completely valid, and we deeply regret this experience.", "We're genuinely sorry to read about your experience."],
            "closer": ["We want to make this right for you.", "Your experience matters deeply to us.", "We're here for you whenever you need us."],
            "apology": "We deeply understand how disappointing this must have been, and we are truly sorry.",
            "resolution": "We want to make this right and ensure this never happens again.",
            "gratitude": "Hearing this means the world to our entire team."
        },
        "concise": {
            "opener": ["Thanks for the feedback.", "Appreciate your review.", "Thank you for letting us know."],
            "closer": ["Contact us if needed.", "We're here to help.", "Reach out anytime."],
            "apology": "Sorry for the inconvenience.",
            "resolution": "We'll fix this promptly.",
            "gratitude": "Great to hear. Thank you!"
        },
        "apologetic": {
            "opener": ["We are deeply sorry for your experience and take full responsibility.", "We owe you a sincere apology – this fell far below our standards.", "We are truly sorry and feel terrible about what you went through."],
            "closer": ["We are committed to doing better. Thank you for giving us the chance to improve.", "Please give us the opportunity to make this right.", "We will do everything in our power to regain your trust."],
            "apology": "We take full accountability for this and offer our most sincere apologies.",
            "resolution": "We will resolve this immediately and ensure it never happens again.",
            "gratitude": "Thank you so much – your kind words mean everything to us."
        }
    }
    return styles.get(tone, styles["professional"])

def _build_dynamic_reply(review_text: str, sentiment: str, tone: str, brand_voice: str = "") -> str:
    """
    Build a dynamic, context-aware reply based on actual review content.
    This is the intelligent fallback when Claude API is unavailable.
    """
    style = _get_tone_style(tone)
    opener = random.choice(style["opener"])
    closer = random.choice(style["closer"])
    text_lower = review_text.lower()

    # Extract 1-2 specific phrases from the review to make reply feel personalized
    specific_mentions = []
    if "delivery" in text_lower or "shipping" in text_lower:
        specific_mentions.append("delivery experience")
    if "quality" in text_lower:
        specific_mentions.append("product quality")
    if "customer service" in text_lower or "support" in text_lower:
        specific_mentions.append("our customer support")
    if "price" in text_lower or "value" in text_lower:
        specific_mentions.append("pricing and value")
    if "packaging" in text_lower:
        specific_mentions.append("packaging")

    # Build body based on sentiment + detected issues
    if sentiment == "positive":
        positives = _extract_positives(review_text)
        mention = ""
        if "fast_delivery" in positives:
            mention = "We work hard to ensure fast, reliable delivery and it's wonderful to know it made a difference."
        elif "great_quality" in positives:
            mention = "Product quality is something we take immense pride in, and your words confirm we're on the right track."
        elif "good_service" in positives:
            mention = "Our team works incredibly hard to provide excellent support, and this kind of feedback motivates them greatly."
        elif "exceeded_expectations" in positives:
            mention = "Exceeding expectations is exactly what we strive for, and knowing we achieved that for you is incredibly rewarding."
        else:
            mention = "Your satisfaction is our greatest reward, and we're so pleased everything met your expectations."
        body = f"{style['gratitude']} {mention}"

    elif sentiment == "negative":
        issues = _extract_review_issues(review_text)
        issue_response = ""
        if "delivery" in issues:
            issue_response = "Your delivery experience was clearly unacceptable, and we are taking immediate steps to review our logistics process."
        elif "quality" in issues:
            issue_response = "Product quality falling short is something we take extremely seriously. We have forwarded your feedback to our quality control team."
        elif "customer_service" in issues:
            issue_response = "The support experience you described does not reflect our standards. We are reviewing this with our team immediately."
        elif "wrong_item" in issues:
            issue_response = "Receiving the wrong item is a serious error on our part. Please contact us directly and we will arrange an immediate replacement at no cost."
        elif "refund" in issues:
            issue_response = "We want to resolve this financially for you. Please contact our support team and we will process your request as a priority."
        elif specific_mentions:
            issue_response = f"Your concerns about {specific_mentions[0]} have been noted and escalated to the relevant team."
        else:
            issue_response = "Every detail of your feedback has been carefully noted and shared with our improvement team."
        body = f"{style['apology']} {issue_response} {style['resolution']}"

    else:  # neutral
        if specific_mentions:
            body = f"Thank you for your balanced feedback regarding your {specific_mentions[0]}. We take every point seriously as it helps us continuously improve our service."
        else:
            body = "Thank you for your honest assessment. We always look for opportunities to improve, and balanced feedback like yours is exactly what helps us do that."

    brand_suffix = ""
    if brand_voice:
        # Extract key directive from brand voice
        if "30-day" in brand_voice or "refund" in brand_voice.lower():
            brand_suffix = " Remember, our 30-day no-questions-asked return policy is always available to you."
        elif "guarantee" in brand_voice.lower():
            brand_suffix = " Our satisfaction guarantee means we will not rest until this is resolved."

    return f"{opener} {body}{brand_suffix} {closer}".strip()


def _coach_review_reply(review: str, reply: str, tone: str) -> dict:
    """
    Intelligently score and improve a customer service reply.
    Reads actual content rather than giving fixed scores.
    """
    reply_lower = reply.lower()
    review_lower = review.lower()

    # Empathy scoring - does reply acknowledge feelings?
    empathy_words = ["sorry", "apologize", "understand", "frustrat", "disappoint", "concern", "feel", "hear you"]
    empathy = min(10, 4 + sum(2 for w in empathy_words if w in reply_lower))

    # Professionalism scoring
    unprofessional = ["whatever", "not my problem", "you should have", "clearly", "obviously"]
    professional_markers = ["thank you", "please", "we will", "our team", "ensure", "happy to help"]
    professionalism = max(4, 8 - sum(2 for w in unprofessional if w in reply_lower) + min(2, sum(1 for w in professional_markers if w in reply_lower)))
    professionalism = min(10, professionalism)

    # Resolution scoring - does it offer concrete next steps?
    resolution_words = ["contact", "refund", "replace", "resolve", "fix", "team", "reach out", "will", "immediately", "next step"]
    resolution = min(10, 4 + sum(1 for w in resolution_words if w in reply_lower))

    # Clarity scoring - length and structure
    word_count = len(reply.split())
    clarity = 8 if 20 <= word_count <= 100 else (6 if word_count < 20 else 7)

    # Tone match scoring - does tone match what was requested?
    tone_indicators = {
        "professional": ["we", "our", "appreciate", "ensure"],
        "friendly": ["!", "hey", "awesome", "great news"],
        "empathetic": ["understand", "sorry", "feel", "hear"],
        "concise": [],
        "apologetic": ["sorry", "apologize", "regret", "fault"]
    }
    expected = tone_indicators.get(tone, [])
    tone_match = min(10, 6 + sum(1 for w in expected if w in reply_lower)) if expected else 7

    # Detect if reply addresses the actual review content
    review_keywords = set(re.findall(r'\b\w{4,}\b', review_lower)) - {"this", "that", "with", "from", "have", "been", "were", "they"}
    reply_keywords = set(re.findall(r'\b\w{4,}\b', reply_lower))
    overlap = len(review_keywords & reply_keywords)
    personalization_bonus = min(2, overlap // 2)

    overall = round((empathy * 0.25 + professionalism * 0.2 + resolution * 0.25 + clarity * 0.15 + tone_match * 0.15) + personalization_bonus * 0.1)
    overall = max(1, min(10, int(overall)))
    empathy = max(1, min(10, int(empathy)))
    professionalism = max(1, min(10, int(professionalism)))
    resolution = max(1, min(10, int(resolution)))

    # Generate feedback based on lowest scores
    weakest = min(
        [("empathy", empathy), ("professionalism", professionalism), ("resolution", resolution), ("clarity", clarity)],
        key=lambda x: x[1]
    )

    feedback_map = {
        "empathy": "Your reply would benefit from a stronger empathetic opener that directly acknowledges the customer's specific feelings before moving to solutions.",
        "professionalism": "The reply's tone could be more consistent and polished. Avoid ambiguous language and ensure every sentence reflects your brand standards.",
        "resolution": "The reply lacks a concrete resolution path. Customers need to know their exact next step — add a specific action like contacting support, a refund timeline, or a replacement process.",
        "clarity": f"{'The reply is very brief — add more context and a clear action step.' if word_count < 20 else 'The reply is quite long. Consider trimming to 2-3 focused sentences covering: acknowledgment, apology if needed, and resolution.'}",
    }
    feedback = feedback_map.get(weakest[0], "Good reply overall. Small improvements in personalization and specificity would make it even stronger.")

    # Build improved version
    improved = _build_dynamic_reply(review, "negative" if any(w in review_lower for w in ["bad","terrible","awful","broken","wrong","fail"]) else "positive" if any(w in review_lower for w in ["great","love","amazing","perfect","excellent"]) else "neutral", tone)

    return {
        "score": overall,
        "empathy": empathy,
        "professionalism": professionalism,
        "resolution": resolution,
        "clarity": clarity,
        "tone_match": tone_match,
        "feedback": feedback,
        "improved": improved
    }


def generate_insights(stats: dict, session_name: str = "") -> str:
    if not stats:
        return "No data available for analysis."
    prompt = (
        f'Analyze these review statistics for "{session_name}":\n'
        f'Total: {stats.get("total",0)} reviews. '
        f'Positive: {stats.get("positive_pct",0)}%, Negative: {stats.get("negative_pct",0)}%, Neutral: {stats.get("neutral_pct",0)}%. '
        f'Average sentiment score: {stats.get("avg_score",0):.3f}. '
        f'Trend: {stats.get("sentiment_trend","stable")} (first half: {stats.get("first_half_score",0):.3f}, second half: {stats.get("second_half_score",0):.3f}). '
        f'Fake/suspicious reviews: {stats.get("fake_pct",0)}% ({stats.get("fake_count",0)} reviews). '
        f'Top topics: {list(stats.get("top_topics",{}).keys())[:5]}. '
        f'Top keywords: {[k["word"] for k in stats.get("top_keywords",[])[:8]]}. '
        f'Dominant emotions: {list(stats.get("emotion_totals",{}).keys())[:3]}.\n\n'
        f'Provide a concise 3-sentence analysis: (1) overall verdict, (2) main strength or concern, (3) top recommendation.'
    )
    result = _call_claude(prompt)
    if result == "__INVALID_KEY__":
        return _fallback_insights(stats) + " ⚠️ (API key invalid — check ANTHROPIC_API_KEY in .env)"
    return result or _fallback_insights(stats)


def ai_chat(question: str, context: dict, history: list = None) -> str:
    if history is None:
        history = []
    sess = context
    sname = sess.get("session_name", "this session")
    SYSTEM = (
        "You are NestInsights AI, a smart friendly analyst assistant inside a consumer intelligence platform. "
        "You are helping analyze a session called: " + repr(sname) + " "
        "containing " + str(sess.get("total", 0)) + " customer reviews.\n"
        "Session data:\n"
        "  Sentiment: " + str(sess.get("positive_pct", 0)) + "% positive, "
        + str(sess.get("negative_pct", 0)) + "% negative, "
        + str(sess.get("neutral_pct", 0)) + "% neutral\n"
        "  Avg score: " + str(round(sess.get("avg_score", 0), 3)) + " (scale -1 to +1)\n"
        "  Trend: " + str(sess.get("trend", "stable")) + "\n"
        "  Summary: " + str(sess.get("summary", ""))[:400] + "\n\n"
        "Rules:\n"
        "- Be natural and conversational like a smart colleague\n"
        "- Greetings = warm brief reply (1-2 sentences)\n"
        "- Data questions = specific answers with actual numbers\n"
        "- Never repeat the same intro every message\n"
        "- Never say As an AI or I cannot\n"
        "- Answers under 4 sentences unless asked for detail\n"
        "- Answer off-topic questions naturally too"
    )
    if not ANTHROPIC_API_KEY:
        return _fallback_chat(question, context)
    try:
        import anthropic
        client = anthropic.Anthropic(api_key=ANTHROPIC_API_KEY)
        messages = []
        for h in (history or [])[-12:]:
            role = h.get("role", "user")
            if role == "ai": role = "assistant"
            text = h.get("content", h.get("text", ""))
            if text and role in ("user", "assistant"):
                messages.append({"role": role, "content": text})
        messages.append({"role": "user", "content": question})
        r = client.messages.create(model="claude-haiku-4-5-20251001", max_tokens=400, system=SYSTEM, messages=messages)
        return r.content[0].text if r.content else _fallback_chat(question, context)
    except Exception as e:
        err = str(e).lower()
        if "api_key" in err or "authentication" in err or "unauthorized" in err:
            return "API key issue. Check ANTHROPIC_API_KEY in backend/.env. " + _fallback_chat(question, context)
        return _fallback_chat(question, context)


def generate_ticket_insights(stats: dict) -> str:
    if not stats:
        return "No ticket data available."
    prompt = (
        f'Analyze these customer support ticket statistics:\n'
        f'Total: {stats.get("total",0)} tickets. '
        f'Critical: {stats.get("critical_count",0)} ({stats.get("critical_pct",0)}%). '
        f'Needs attention: {stats.get("needs_attention",0)}. '
        f'Avg urgency: {stats.get("avg_urgency",0):.2f}/1.0. '
        f'Top category: {stats.get("top_category","N/A")}. '
        f'Category breakdown: {stats.get("category_breakdown",{})}.\n\n'
        f'Give 2-sentence analysis: (1) most urgent priority, (2) one process improvement.'
    )
    result = _call_claude(prompt)
    if result and result != "__INVALID_KEY__":
        return result
    return _fallback_ticket_insights(stats)


def generate_response_suggestion(review_text: str, sentiment: str) -> str:
    prompt = (
        f'Write a professional customer service response to this {sentiment} review:\n\n'
        f'"{review_text}"\n\n'
        f'Response should be: empathetic, professional, 2-3 sentences, not defensive, brand-friendly.'
    )
    result = _call_claude(prompt, max_tokens=200)
    if result and result != "__INVALID_KEY__":
        return result
    return _build_dynamic_reply(review_text, sentiment, "professional")


def generate_studio_bulk(reviews: list, tone: str, brand_voice: str) -> list:
    """Generate bulk replies — Claude if available, else intelligent per-review fallback."""
    results = []
    for r in reviews:
        text = r.get("text", "")
        sentiment = r.get("sentiment", "neutral")
        if not text.strip():
            continue
        brand_note = f"\nBrand voice to follow: {brand_voice}" if brand_voice else ""
        tone_desc = {
            "professional": "formal, polished, brand-aligned",
            "friendly": "warm, approachable, upbeat",
            "empathetic": "emotionally aware, caring, sincere",
            "concise": "brief, direct, no filler words",
            "apologetic": "sincere, accountable, remorseful"
        }.get(tone, "professional")

        prompt = (
            f"Write a unique {tone_desc} customer service reply specifically addressing this {sentiment} review. "
            f"Reference specific details mentioned in the review. Do NOT use generic templates.{brand_note}\n"
            f"Review: \"{text}\"\n"
            f"Write one ready-to-publish reply (2-3 sentences, no placeholders):"
        )
        reply_text = _call_claude(prompt, max_tokens=220)
        if not reply_text or reply_text == "__INVALID_KEY__":
            reply_text = _build_dynamic_reply(text, sentiment, tone, brand_voice)

        # Quality score based on reply content
        words = len(reply_text.split())
        quality = 9 if 25 <= words <= 80 else (8 if words > 80 else 7)

        results.append({"review": text, "reply": reply_text, "sentiment": sentiment, "quality_score": quality})
    return results


def generate_studio_coach(review: str, reply: str, tone: str) -> dict:
    """Score and improve a reply using Claude if available, else intelligent rule-based scoring."""
    prompt = (
        f"You are an expert customer service coach. Evaluate this reply to a customer review.\n\n"
        f"Review: \"{review}\"\n"
        f"Reply written: \"{reply}\"\n"
        f"Expected tone: {tone}\n\n"
        f"Respond ONLY in JSON with keys: score (1-10 int), empathy (1-10 int), "
        f"professionalism (1-10 int), resolution (1-10 int), clarity (1-10 int), "
        f"tone_match (1-10 int), feedback (1-2 sentence specific critique string), "
        f"improved (a better version that directly references the review content). No markdown, just raw JSON."
    )
    result = _call_claude(prompt, max_tokens=500)
    if result and result != "__INVALID_KEY__":
        try:
            import re as _re
            clean = _re.sub(r'```json|```', '', result).strip()
            import json as _json
            return _json.loads(clean)
        except Exception:
            pass
    return _coach_review_reply(review, reply, tone)


def generate_studio_template(review: str, category: str, tone: str, brand_voice: str) -> str:
    """Generate industry-specific template reply."""
    industry_context = {
        "ecommerce": "e-commerce/online retail. Always mention shipping, returns policy, and customer satisfaction guarantee if relevant.",
        "saas": "SaaS/software company. Reference support team, technical resolution, and product roadmap improvements.",
        "hospitality": "hotel/hospitality business. Mention guest experience, room/service standards, and invite them back.",
        "healthcare": "healthcare provider. Be empathetic, mention patient care standards, always suggest professional consultation.",
        "restaurant": "restaurant/food service. Express passion for food quality, invite them back, mention chef/team.",
        "retail": "retail store. Mention in-store experience, manager availability, exchange/return policy.",
        "finance": "financial services. Be precise, regulatory-aware, never make promises about financial outcomes.",
        "logistics": "logistics/shipping company. Reference SLA, tracking system, carrier partnerships.",
        "education": "educational institution. Be supportive, outcomes-focused, academic excellence focused.",
        "telecom": "telecommunications provider. Mention technical support escalation, network improvements, SLA.",
    }.get(category, "business")

    brand_note = f"\nBrand personality to embody: {brand_voice}" if brand_voice else ""
    tone_desc = {"professional":"formal","friendly":"warm and casual","empathetic":"deeply caring","concise":"brief","apologetic":"sincerely apologetic"}.get(tone,"professional")

    prompt = (
        f"You are a {tone_desc} customer service expert for a {industry_context}{brand_note}\n"
        f"Write a unique reply to this specific review that references the exact issues/praises mentioned:\n"
        f"Review: \"{review}\"\n"
        f"Write one polished, ready-to-publish reply (2-4 sentences). Reference specific review details. No placeholders."
    )
    result = _call_claude(prompt, max_tokens=300)
    if result and result != "__INVALID_KEY__":
        return result
    # Intelligent fallback
    return _build_dynamic_reply(review, "negative" if any(w in review.lower() for w in ["bad","terrible","awful","broken","wrong","disappointed"]) else "positive" if any(w in review.lower() for w in ["great","love","amazing","perfect","excellent","good"]) else "neutral", tone, brand_voice)


def generate_studio_score(review: str, reply: str) -> dict:
    """Score a reply comprehensively."""
    prompt = (
        f"Score this customer service reply across dimensions.\n"
        f"Review: \"{review}\"\nReply: \"{reply}\"\n\n"
        f"Respond ONLY as JSON: empathy(1-10), clarity(1-10), professionalism(1-10), "
        f"resolution(1-10), tone_match(1-10), overall(1-10), verdict(2 sentence specific assessment). Raw JSON only."
    )
    result = _call_claude(prompt, max_tokens=350)
    if result and result != "__INVALID_KEY__":
        try:
            import re as _re, json as _json
            clean = _re.sub(r'```json|```', '', result).strip()
            return _json.loads(clean)
        except Exception:
            pass
    scored = _coach_review_reply(review, reply, "professional")
    return {
        "empathy": scored["empathy"],
        "clarity": scored["clarity"],
        "professionalism": scored["professionalism"],
        "resolution": scored["resolution"],
        "tone_match": scored["tone_match"],
        "overall": scored["score"],
        "verdict": scored["feedback"],
    }


def generate_studio_abtest(review: str, tones: list, brand_voice: str) -> list:
    """Generate A/B test variants for different tones."""
    variants = []
    for tone in tones:
        reply = generate_studio_template(review, "ecommerce", tone, brand_voice)
        variants.append({"tone": tone, "reply": reply})
    return variants


def generate_studio_analyze(text: str) -> dict:
    """Deep analyze a single review for the analyzer tool."""
    from ml_engine import analyze_review
    result = analyze_review(text)
    return result


def _fallback_insights(stats: dict) -> str:
    pos = stats.get("positive_pct", 0)
    neg = stats.get("negative_pct", 0)
    fake = stats.get("fake_pct", 0)
    trend = stats.get("sentiment_trend", "stable")
    top_topics = list(stats.get("top_topics", {}).keys())[:3]
    label = "strong positive" if pos > 70 else "mostly positive" if pos > 50 else "mixed" if pos > 30 else "predominantly negative"
    parts = [f"Overall sentiment is {label} with {pos}% positive and {neg}% negative reviews."]
    if top_topics:
        parts.append(f"Main discussion areas: {', '.join(top_topics)}.")
    if trend != "stable":
        parts.append(f"Sentiment is {trend} over the analysis period.")
    if fake > 15:
        parts.append(f"⚠️ {fake}% of reviews flagged as suspicious — manual verification recommended.")
    if neg > 40:
        parts.append("🔴 High negative rate requires immediate attention to customer complaints.")
    elif pos > 75:
        parts.append("🟢 Excellent positive sentiment — leverage in marketing campaigns.")
    parts.append("💡 Add ANTHROPIC_API_KEY to backend/.env for AI-powered deep insights.")
    return " ".join(parts)


def _fallback_ticket_insights(stats: dict) -> str:
    critical = stats.get("critical_count", 0)
    top = stats.get("top_category", "Technical Issue")
    needs = stats.get("needs_attention", 0)
    return (
        f"Top ticket category is {top} requiring priority attention. "
        f"{critical} critical tickets need immediate response (within 1-4 hours). "
        f"{needs} tickets total need high-priority attention. "
        "💡 Add ANTHROPIC_API_KEY for AI-drafted response suggestions."
    )


def _fallback_chat(question: str, context: dict) -> str:
    q = question.lower()
    pos = context.get("positive_pct", 0)
    neg = context.get("negative_pct", 0)
    total = context.get("total", 0)
    if any(w in q for w in ["complaint","negative","bad","worst","problem","issue"]):
        return f"Based on the data, {neg}% of {total} reviews are negative. Focus on recurring complaints in the topics section for specific pain points."
    if any(w in q for w in ["positive","good","best","love","great","strength"]):
        return f"{pos}% of reviews are positive. The main positive themes appear in the top keywords and aspects sections."
    if any(w in q for w in ["improve","recommend","suggest","action","next step"]):
        return f"With {neg}% negative sentiment, priority should be addressing the most common complaint topics. Review the Aspects tab for specific areas needing improvement."
    return f"This session has {total} reviews with {pos}% positive and {neg}% negative sentiment. Check the Overview tab for detailed breakdowns."


def generate_compare_insights(comparisons: list) -> str:
    if not comparisons:
        return "No comparison data available."
    summary_lines = [
        f"- {c.get('name','Session')}: {c.get('total_reviews',0)} reviews, "
        f"{c.get('positive_pct',0)}% positive, {c.get('negative_pct',0)}% negative, "
        f"avg score {c.get('avg_score',0):.3f}, fake reviews {c.get('fake_count',0)}"
        for c in comparisons
    ]
    winner = next((c for c in comparisons if c.get('winner')), comparisons[0])
    prompt = (
        f"You are analyzing a competitive sentiment comparison for a business intelligence report.\n\n"
        f"Sessions compared:\n" + "\n".join(summary_lines) + "\n\n"
        f"Best performing: {winner.get('name','')}\n\n"
        f"Provide a 3-paragraph professional analysis:\n"
        f"1. Which session performed best and why, with specific numbers.\n"
        f"2. Key differences in sentiment patterns.\n"
        f"3. Specific actionable recommendations for the underperforming sessions.\n"
        f"Be direct, data-driven, write for a business executive audience."
    )
    result = _call_claude(prompt, max_tokens=500)
    if result and result != "__INVALID_KEY__":
        return result
    return _fallback_compare_insights(comparisons, winner)


def _fallback_compare_insights(comparisons: list, winner: dict) -> str:
    sorted_c = sorted(comparisons, key=lambda x: x.get('avg_score', 0), reverse=True)
    best = sorted_c[0]
    worst = sorted_c[-1] if len(sorted_c) > 1 else None
    parts = [f"{best.get('name','Top session')} leads with {best.get('positive_pct',0)}% positive sentiment and an average score of {best.get('avg_score',0):.3f}."]
    if worst and worst['session_id'] != best['session_id']:
        gap = round(best.get('positive_pct',0) - worst.get('positive_pct',0), 1)
        parts.append(f"There is a {gap} percentage point gap between the best and worst performing sessions.")
    parts.append("Focus improvement efforts on the lowest-scoring session by addressing the most common negative topic themes.")
    return " ".join(parts)


def generate_trends_insights(keywords: list, total_sessions: int, total_reviews: int) -> str:
    if not keywords:
        return "No trend data available yet. Analyze some reviews first."
    top10 = {k["word"]: k["count"] for k in keywords[:10]}
    prompt = (
        f"You are a consumer intelligence analyst reviewing keyword trends from {total_reviews} reviews across {total_sessions} sessions.\n\n"
        f"Top keywords by frequency: {top10}\n\n"
        f"Provide a professional 3-paragraph trends report:\n"
        f"1. What the dominant keywords reveal about what customers care about most.\n"
        f"2. Patterns suggesting recurring issues or strengths.\n"
        f"3. Strategic recommendations — what should a company prioritize?\n"
        f"Write for a senior product manager. Be specific and actionable."
    )
    result = _call_claude(prompt, max_tokens=500)
    if result and result != "__INVALID_KEY__":
        return result
    top5 = [k["word"] for k in keywords[:5]]
    return (
        f"Across {total_reviews} analyzed reviews, the most discussed topics are: {', '.join(top5)}. "
        "High frequency of service and delivery-related terms suggests these operational areas drive the most customer sentiment. "
        "Recommendation: Build a response protocol around the top 5 keywords as they represent the primary drivers of customer experience."
    )


def generate_brand_health_report(sessions: list) -> dict:
    """Generate a comprehensive brand health report from multiple sessions."""
    if not sessions:
        return {}
    total_reviews = sum(s.get("total_reviews", 0) for s in sessions)
    avg_pos = sum(s.get("positive_pct", 0) for s in sessions) / len(sessions)
    avg_neg = sum(s.get("negative_pct", 0) for s in sessions) / len(sessions)
    avg_score = sum(s.get("avg_score", 0) for s in sessions) / len(sessions)
    fake_total = sum(s.get("fake_count", 0) for s in sessions)

    # Brand health score 0-100
    health_score = max(0, min(100, int(
        avg_pos * 0.4 +
        (1 - avg_neg/100) * 40 +
        (avg_score + 1) / 2 * 15 +
        (1 - fake_total / max(total_reviews, 1)) * 5
    )))

    prompt = (
        f"Generate a comprehensive brand health report based on customer review data.\n\n"
        f"Data points:\n"
        f"- Sessions analyzed: {len(sessions)}\n"
        f"- Total reviews: {total_reviews}\n"
        f"- Average positive sentiment: {avg_pos:.1f}%\n"
        f"- Average negative sentiment: {avg_neg:.1f}%\n"
        f"- Average sentiment score: {avg_score:.3f}\n"
        f"- Fake reviews flagged: {fake_total}\n"
        f"- Brand health score: {health_score}/100\n\n"
        f"Provide a 4-paragraph brand health assessment:\n"
        f"1. Overall brand health status with score interpretation\n"
        f"2. Key strengths based on positive sentiment drivers\n"
        f"3. Critical vulnerabilities and risk areas\n"
        f"4. 3 specific strategic recommendations to improve brand health\n"
        f"Write for C-suite audience. Be specific, data-driven, and action-oriented."
    )
    narrative = _call_claude(prompt, max_tokens=700)
    if not narrative or narrative == "__INVALID_KEY__":
        label = "Excellent" if health_score >= 80 else "Good" if health_score >= 60 else "Fair" if health_score >= 40 else "Poor"
        narrative = (
            f"Brand Health Assessment: Your brand scores {health_score}/100 ({label}), based on analysis of {total_reviews} customer reviews. "
            f"With {avg_pos:.1f}% positive sentiment and an average score of {avg_score:.3f}, "
            f"{'your brand demonstrates strong customer satisfaction and loyalty.' if avg_pos > 65 else 'there are significant areas requiring strategic attention.'}\n\n"
            f"Key strengths lie in areas where customers consistently express satisfaction. "
            f"{'Fake review rate is within acceptable bounds.' if fake_total < total_reviews * 0.1 else f'Warning: {fake_total} potentially fake reviews detected, which could be skewing your metrics.'}\n\n"
            f"Primary vulnerabilities: {avg_neg:.1f}% negative reviews indicate recurring service or product issues that require systematic resolution.\n\n"
            f"Strategic recommendations: (1) Implement a review response SLA of 24 hours for all negative reviews. "
            f"(2) Launch a customer recovery program targeting the {avg_neg:.0f}% dissatisfied customers. "
            f"(3) Build a proactive review generation campaign to amplify positive voices and raise overall brand perception."
        )
    return {
        "health_score": health_score,
        "health_label": "Excellent" if health_score >= 80 else "Good" if health_score >= 60 else "Fair" if health_score >= 40 else "Poor",
        "total_reviews": total_reviews,
        "avg_positive_pct": round(avg_pos, 1),
        "avg_negative_pct": round(avg_neg, 1),
        "avg_score": round(avg_score, 3),
        "fake_total": fake_total,
        "narrative": narrative,
        "sessions_count": len(sessions),
    }
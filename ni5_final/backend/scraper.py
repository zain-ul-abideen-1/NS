"""
NestInsights v5.0 — Web Scraper
Uses scrape.do API (handles JS rendering, CAPTCHAs, rotating proxies)
Token: set SCRAPE_DO_TOKEN in backend/.env
"""
import re, time, random, os, json
import requests
from bs4 import BeautifulSoup

SCRAPE_DO_TOKEN = os.getenv("SCRAPE_DO_TOKEN", "")

HEADERS_POOL = [
    {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive",
    },
    {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-GB,en;q=0.9",
    },
    {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    },
]

BLOCKED_INDICATORS = [
    "access denied", "robot check", "automated access",
    "cloudflare", "please verify you are a human",
    "enable javascript and cookies", "just a moment",
    "checking your browser", "ddos protection", "security check",
]


def _fetch_direct(url, timeout=20):
    for attempt in range(3):
        try:
            if attempt > 0:
                time.sleep(2 ** attempt + random.uniform(0, 1))
            s = requests.Session()
            s.headers.update(random.choice(HEADERS_POOL))
            if attempt > 0:
                s.headers["Referer"] = "https://www.google.com/"
            r = s.get(url, timeout=timeout, allow_redirects=True)
            if r.status_code == 200:
                html = r.text
                if any(b in html.lower() for b in BLOCKED_INDICATORS):
                    return None, "blocked_by_site"
                return html, None
            elif r.status_code in (403, 401):
                return None, "access_denied"
            elif r.status_code == 404:
                return None, "page_not_found"
            elif r.status_code == 429:
                time.sleep(10)
            else:
                return None, f"http_{r.status_code}"
        except requests.exceptions.ConnectionError:
            return None, "connection_error"
        except requests.exceptions.Timeout:
            return None, "timeout"
        except Exception as e:
            return None, str(e)[:80]
    return None, "max_retries"


def _fetch_via_scrape_do(url, render_js=False):
    """
    scrape.do API — endpoint: http://api.scrape.do/
    Params: token, url, render (optional)
    """
    if not SCRAPE_DO_TOKEN:
        return None, "no_token"
    params = {"token": SCRAPE_DO_TOKEN, "url": url}
    if render_js:
        params["render"] = "true"
    try:
        r = requests.get("http://api.scrape.do/", params=params, timeout=60)
        if r.status_code == 200:
            html = r.text
            if any(b in html.lower() for b in BLOCKED_INDICATORS) and not render_js:
                return _fetch_via_scrape_do(url, render_js=True)
            return html, None
        elif r.status_code == 401:
            return None, "invalid_token"
        elif r.status_code == 429:
            return None, "quota_exceeded"
        else:
            return None, f"scrape_do_http_{r.status_code}"
    except Exception as e:
        return None, f"scrape_do_error: {str(e)[:60]}"


def _fetch_best(url):
    html, err = _fetch_direct(url)
    if html:
        return html, "direct"
    if SCRAPE_DO_TOKEN:
        html2, err2 = _fetch_via_scrape_do(url, render_js=False)
        if html2:
            return html2, "scrape.do"
        html3, err3 = _fetch_via_scrape_do(url, render_js=True)
        if html3:
            return html3, "scrape.do+js"
        return None, f"all_failed | direct:{err} | scrape.do:{err2} | js:{err3}"
    return None, f"direct_failed:{err}"


# ── Parsers ────────────────────────────────────────────────────────────────────

def _parse_json_ld(soup):
    reviews = []
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            raw = re.sub(r'[\x00-\x1f\x7f]', ' ', script.string or "")
            data = json.loads(raw)
            items = data if isinstance(data, list) else [data]
            for item in items:
                if "@graph" in item:
                    items = items + item["@graph"]
                rtype = item.get("@type", "")
                if rtype in ("Product","LocalBusiness","Organization","SoftwareApplication","App","WebSite","Service"):
                    for rv in item.get("review", []):
                        body = rv.get("reviewBody") or rv.get("description") or ""
                        if len(body.strip()) > 10:
                            author = rv.get("author", {})
                            reviews.append({
                                "text":   body.strip(),
                                "author": author.get("name","") if isinstance(author, dict) else str(author),
                                "rating": float((rv.get("reviewRating") or {}).get("ratingValue") or 0),
                                "date":   rv.get("datePublished",""),
                            })
                elif rtype == "Review":
                    body = item.get("reviewBody") or item.get("description") or ""
                    if len(body.strip()) > 10:
                        author = item.get("author") or {}
                        reviews.append({
                            "text":   body.strip(),
                            "author": author.get("name","") if isinstance(author, dict) else "",
                            "rating": float((item.get("reviewRating") or {}).get("ratingValue") or 0),
                            "date":   item.get("datePublished",""),
                        })
        except Exception:
            continue
    return reviews


def _parse_trustpilot(soup):
    reviews = []
    for tag, cls in [("article", {"data-service-review-card-paper": True}),
                     ("div", re.compile(r"styles_reviewCard|ReviewCard", re.I))]:
        cards = soup.find_all(tag, class_=cls) if isinstance(cls, re.Pattern) else soup.find_all(tag, attrs=cls)
        for card in cards:
            el = (card.find("p", {"data-service-review-text-typography": True}) or
                  card.find("p", class_=re.compile(r"typography|review.*text", re.I)) or
                  card.find("p"))
            if el and len(el.get_text(strip=True)) > 15:
                auth = card.find(attrs={"data-consumer-name-typography": True})
                reviews.append({"text": el.get_text(strip=True), "author": auth.get_text(strip=True) if auth else "", "rating": 0, "date": ""})
        if reviews:
            break
    return reviews


def _parse_amazon(soup):
    reviews = []
    for el in soup.find_all("span", {"data-hook": "review-body"}):
        inner = el.find("span")
        t = (inner or el).get_text(separator=" ", strip=True)
        if len(t) > 15:
            reviews.append({"text": t, "author": "", "rating": 0, "date": ""})
    return reviews


def _parse_yelp(soup):
    reviews = []
    for el in soup.find_all("p", class_=re.compile(r"comment|review.*text", re.I)):
        t = el.get_text(separator=" ", strip=True)
        if len(t) > 20:
            reviews.append({"text": t, "author": "", "rating": 0, "date": ""})
    return reviews


def _parse_generic(soup):
    reviews = []
    seen = set()
    patterns = [
        ("div",  re.compile(r"\breview[\-_]?(body|text|content|item|card|comment)\b", re.I)),
        ("p",    re.compile(r"\breview[\-_]?(body|text|content)\b", re.I)),
        ("div",  re.compile(r"\bcomment[\-_]?(body|text|content|item)\b", re.I)),
        ("div",  re.compile(r"\btestimoni(al)?[\-_]?(body|text|content|item)?\b", re.I)),
        ("span", re.compile(r"\breview[\-_]?(body|text)\b", re.I)),
        ("li",   re.compile(r"\breview[\-_]?(item|card)\b", re.I)),
        ("div",  re.compile(r"\bfeedback[\-_]?(text|content|item)\b", re.I)),
        ("blockquote", None),
    ]
    for tag, pat in patterns:
        els = soup.find_all(tag, class_=pat) if pat else soup.find_all(tag)
        for el in els:
            t = re.sub(r'\s+', ' ', el.get_text(separator=" ", strip=True))
            if 25 < len(t) < 2000 and t not in seen:
                seen.add(t)
                reviews.append({"text": t, "author": "", "rating": 0, "date": ""})
        if len(reviews) >= 50:
            break
    if len(reviews) < 5:
        for el in soup.find_all(attrs={"itemprop": "reviewBody"}) + soup.find_all(attrs={"data-review": True}):
            t = re.sub(r'\s+', ' ', el.get_text(separator=" ", strip=True))
            if 25 < len(t) < 2000 and t not in seen:
                seen.add(t)
                reviews.append({"text": t, "author": "", "rating": 0, "date": ""})
    if len(reviews) < 5:
        noise = re.compile(r"(nav|header|footer|menu|sidebar|cookie|copyright|privacy|terms)", re.I)
        for p in soup.find_all("p"):
            if noise.search(" ".join(p.parent.get("class", []))):
                continue
            t = re.sub(r'\s+', ' ', p.get_text(separator=" ", strip=True))
            if 40 < len(t) < 1000 and t not in seen:
                seen.add(t)
                reviews.append({"text": t, "author": "", "rating": 0, "date": ""})
            if len(reviews) >= 40:
                break
    return reviews[:100]


def scrape_reviews(url: str) -> dict:
    url = url.strip()
    if not url.startswith("http"):
        url = "https://" + url
    domain = re.sub(r'^https?://(www\.)?', '', url).split('/')[0].lower()

    html, method = _fetch_best(url)

    if not html:
        if SCRAPE_DO_TOKEN:
            msg = (f"Could not retrieve page from {domain}. "
                   f"The site may use protection that scrape.do cannot bypass. "
                   f"Try exporting reviews as CSV and using Dataset Upload.")
        else:
            msg = (f"Could not retrieve page from {domain}. "
                   f"Add SCRAPE_DO_TOKEN to backend/.env to enable scraping protected sites.")
        return {"scraped": False, "reviews": [], "count": 0, "error": "fetch_failed", "message": msg, "method": method}

    soup = BeautifulSoup(html, "lxml")
    for el in soup(["script","style","nav","header","footer","aside","noscript","iframe"]):
        el.decompose()

    reviews = []
    if "trustpilot.com" in domain:
        reviews = _parse_trustpilot(soup)
    elif "amazon." in domain:
        reviews = _parse_amazon(soup)
    elif "yelp.com" in domain:
        reviews = _parse_yelp(soup)

    if not reviews:
        reviews = _parse_json_ld(soup)
    if not reviews:
        reviews = _parse_generic(soup)

    if not reviews:
        return {
            "scraped": False, "reviews": [], "count": 0,
            "error": "no_reviews_found",
            "message": (f"Page loaded from {domain} but no review text detected. "
                        f"The site likely loads reviews via JavaScript. "
                        f"Try enabling JS rendering or export reviews as CSV."),
            "method": method,
        }

    cleaned = [{"text": re.sub(r'\s+', ' ', rv["text"].strip()), **{k:v for k,v in rv.items() if k!="text"}}
               for rv in reviews if len(rv.get("text","").strip()) > 15]

    via = f" via {method}" if method != "direct" else ""
    return {
        "scraped": True,
        "reviews": cleaned[:300],
        "count":   len(cleaned[:300]),
        "error":   None,
        "message": f"Scraped {len(cleaned[:300])} reviews from {domain}{via}",
        "method":  method,
    }

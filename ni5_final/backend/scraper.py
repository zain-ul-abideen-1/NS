"""
NestInsights v5.0 — Web Scraper
Multi-method scraping with 4 fallback layers:
1. Direct HTTP (fastest, free)
2. ScrapingBee with JS rendering (paid, handles most sites)
3. Zenrows free tier (backup scraper)
4. Google Cache / Search snippets (last resort)
"""
import re, time, random, os, json, hashlib
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlencode, quote_plus

WEBSCRAPING_AI_KEY = os.getenv("WEBSCRAPING_AI_KEY", "")
ZENROWS_KEY      = os.getenv("ZENROWS_KEY", "")       # free: 1000 credits/mo at zenrows.com

HEADERS_POOL = [
    {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36","Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8","Accept-Language": "en-US,en;q=0.9","Accept-Encoding": "gzip, deflate, br","Connection": "keep-alive"},
    {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15","Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8","Accept-Language": "en-GB,en;q=0.9"},
    {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64; rv:125.0) Gecko/20100101 Firefox/125.0","Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8","Accept-Language": "en-US,en;q=0.5"},
]

BLOCKED_INDICATORS = ["access denied","robot check","automated access","cloudflare","please verify you are a human","enable javascript and cookies","just a moment","checking your browser","ddos protection","security check"]


# ── METHOD 1: Direct HTTP ──────────────────────────────────────────────────────
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
        except requests.exceptions.Timeout:
            return None, "timeout"
        except Exception as e:
            return None, str(e)[:80]
    return None, "max_retries"


# ── METHOD 2: WebScraping.AI ──────────────────────────────────────────────────
def _fetch_via_webscrapingai(url, render_js=True):
    if not WEBSCRAPING_AI_KEY:
        return None, "no_key"
    params = {
        "api_key":  WEBSCRAPING_AI_KEY,
        "url":      url,
        "js":       "true" if render_js else "false",
        "proxy":    "datacenter",
    }
    try:
        r = requests.get("https://api.webscraping.ai/html", params=params, timeout=60)
        if r.status_code == 200 and len(r.text) > 200:
            if any(b in r.text.lower() for b in BLOCKED_INDICATORS):
                return None, "still_blocked"
            return r.text, None
        elif r.status_code == 401:
            return None, "invalid_key"
        elif r.status_code == 429:
            return None, "quota_exceeded"
        else:
            return None, f"webscrapingai_{r.status_code}"
    except Exception as e:
        return None, f"webscrapingai_error:{str(e)[:50]}"


# ── METHOD 3: ZenRows (free 1000 credits/mo) ──────────────────────────────────
def _fetch_via_zenrows(url):
    if not ZENROWS_KEY:
        return None, "no_key"
    params = {
        "apikey":      ZENROWS_KEY,
        "url":         url,
        "js_render":   "true",
        "premium_proxy":"true",
    }
    try:
        r = requests.get("https://api.zenrows.com/v1/", params=params, timeout=60)
        if r.status_code == 200 and len(r.text) > 200:
            return r.text, None
        return None, f"zenrows_{r.status_code}"
    except Exception as e:
        return None, f"zenrows_error:{str(e)[:50]}"


# ── METHOD 4: Google Cache ────────────────────────────────────────────────────
def _fetch_google_cache(url):
    """Try Google's cached version of the page — often bypasses bot protection."""
    cache_url = f"https://webcache.googleusercontent.com/search?q=cache:{quote_plus(url)}&hl=en"
    try:
        s = requests.Session()
        s.headers.update(random.choice(HEADERS_POOL))
        r = s.get(cache_url, timeout=20, allow_redirects=True)
        if r.status_code == 200 and len(r.text) > 500:
            if "did not match any documents" not in r.text.lower():
                return r.text, None
        return None, f"cache_{r.status_code}"
    except Exception as e:
        return None, f"cache_error:{str(e)[:50]}"


# ── METHOD 5: Trustpilot API (official) ───────────────────────────────────────
def _fetch_trustpilot_api(url):
    """Trustpilot unofficial API — fetches up to 300 reviews across multiple pages."""
    match = re.search(r'trustpilot\.com/review/([^/?#]+)', url)
    if not match:
        return []
    domain = match.group(1)
    reviews = []

    # Get business unit id first
    buid = None
    try:
        lookup = requests.get(
            f"https://www.trustpilot.com/api/categoriespages/find-business-unit/search?query={domain}",
            headers={**random.choice(HEADERS_POOL), "Accept": "application/json"}, timeout=15
        )
        if lookup.status_code == 200:
            units = lookup.json().get("businessUnits", [])
            if units:
                buid = units[0].get("id", "")
    except Exception:
        pass

    # Paginate through reviews
    per_page = 20
    max_pages = 15  # up to 300 reviews
    for page in range(1, max_pages + 1):
        try:
            if buid:
                api_url = f"https://www.trustpilot.com/api/categoriespages/{buid}/reviews?perPage={per_page}&page={page}"
            else:
                api_url = f"https://www.trustpilot.com/api/categoriespages/search/reviews?businessUnitId={domain}&perPage={per_page}&page={page}"
            r = requests.get(api_url, headers={**random.choice(HEADERS_POOL), "Accept": "application/json"}, timeout=15)
            if r.status_code != 200:
                break
            data = r.json()
            page_reviews = data.get("reviews", [])
            if not page_reviews:
                break
            for rv in page_reviews:
                text = rv.get("text", "") or rv.get("title", "")
                if len(text) > 15:
                    reviews.append({"text": text, "author": rv.get("consumer", {}).get("displayName", ""), "rating": rv.get("rating", 0), "date": rv.get("createdAt", "")})
            if len(reviews) >= 300:
                break
            # Stop if last page
            total = data.get("pagination", {}).get("totalReviews", 0)
            if total and len(reviews) >= total:
                break
            time.sleep(0.3)
        except Exception:
            break
    return reviews


# ── MASTER FETCH — tries all methods in order ─────────────────────────────────
def _fetch_best(url):
    domain = re.sub(r'^https?://(www\.)?', '', url).split('/')[0].lower()

    # Trustpilot — try API first before any scraping
    if "trustpilot.com" in domain:
        tp_reviews = _fetch_trustpilot_api(url)
        if tp_reviews:
            return None, "trustpilot_api", tp_reviews

    # Method 1: Direct
    html, err = _fetch_direct(url)
    if html:
        return html, "direct", None

    # Method 2: ScrapingBee
    if WEBSCRAPING_AI_KEY:
        html, err2 = _fetch_via_webscrapingai(url, render_js=True)
        if html:
            return html, "webscrapingai", None

    # Method 3: ZenRows
    if ZENROWS_KEY:
        html, err3 = _fetch_via_zenrows(url)
        if html:
            return html, "zenrows", None

    # Method 4: Google Cache
    html, err4 = _fetch_google_cache(url)
    if html:
        return html, "google_cache", None

    return None, "all_failed", None


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
                            reviews.append({"text": body.strip(), "author": author.get("name","") if isinstance(author, dict) else str(author), "rating": float((rv.get("reviewRating") or {}).get("ratingValue") or 0), "date": rv.get("datePublished","")})
                elif rtype == "Review":
                    body = item.get("reviewBody") or item.get("description") or ""
                    if len(body.strip()) > 10:
                        author = item.get("author") or {}
                        reviews.append({"text": body.strip(), "author": author.get("name","") if isinstance(author, dict) else "", "rating": float((item.get("reviewRating") or {}).get("ratingValue") or 0), "date": item.get("datePublished","")})
        except Exception:
            continue
    return reviews


def _parse_trustpilot(soup):
    reviews = []
    for tag, cls in [
        ("article", {"data-service-review-card-paper": True}),
        ("div", re.compile(r"styles_reviewCard|ReviewCard", re.I)),
        ("div", re.compile(r"review-card|reviewCard", re.I)),
    ]:
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


def _parse_google_maps(soup):
    reviews = []
    for el in soup.find_all(["span","div"], class_=re.compile(r"wiI7pd|review-full-text|review-snippet", re.I)):
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
    return reviews[:300]


# ── PAGE URL BUILDER ─────────────────────────────────────────────────────────
def _build_page_urls(url, domain, max_pages=12):
    """Generate paginated URLs for common review sites."""
    pages = []
    if "amazon." in domain:
        base = re.sub(r'[?&]pageNumber=\d+', '', url)
        sep = '&' if '?' in base else '?'
        for p in range(2, max_pages + 1):
            pages.append(f"{base}{sep}pageNumber={p}")
    elif "yelp.com" in domain:
        base = re.sub(r'[?&]start=\d+', '', url)
        sep = '&' if '?' in base else '?'
        for p in range(1, max_pages):
            pages.append(f"{base}{sep}start={p*20}")
    elif "tripadvisor." in domain:
        for p in range(1, max_pages):
            paged = re.sub(r'-or\d+', '', url)
            pages.append(paged.replace('.html', f'-or{p*10}.html'))
    else:
        base = re.sub(r'[?&](page|p)=\d+', '', url)
        sep = '&' if '?' in base else '?'
        for p in range(2, max_pages + 1):
            pages.append(f"{base}{sep}page={p}")
    return pages[:max_pages]

# ── MAIN ENTRY ────────────────────────────────────────────────────────────────
def scrape_reviews(url: str) -> dict:
    url = url.strip()
    if not url.startswith("http"):
        url = "https://" + url
    domain = re.sub(r'^https?://(www\.)?', '', url).split('/')[0].lower()

    html, method, prefetched_reviews = _fetch_best(url)

    # Trustpilot API returned reviews directly
    if prefetched_reviews:
        cleaned = [{"text": re.sub(r'\s+', ' ', rv["text"].strip()), **{k:v for k,v in rv.items() if k != "text"}} for rv in prefetched_reviews if len(rv.get("text","").strip()) > 15]
        return {"scraped": True, "reviews": cleaned[:300], "count": len(cleaned[:300]), "error": None, "message": f"Fetched {len(cleaned[:300])} reviews from Trustpilot API", "method": "trustpilot_api"}

    if not html:
        return {
            "scraped": False, "reviews": [], "count": 0,
            "error": "fetch_failed",
            "message": (f"Could not retrieve page from {domain} after trying all methods. "
                        f"The site has strong bot protection. "
                        f"Try exporting reviews as CSV and using Dataset Upload instead."),
            "method": method
        }

    def _parse_html(html_content):
        s = BeautifulSoup(html_content, "lxml")
        for el in s(["script","style","nav","header","footer","aside","noscript","iframe"]):
            el.decompose()
        if "trustpilot.com" in domain:
            r = _parse_trustpilot(s)
        elif "amazon." in domain:
            r = _parse_amazon(s)
        elif "yelp.com" in domain:
            r = _parse_yelp(s)
        elif "google.com/maps" in url or "maps.google" in url:
            r = _parse_google_maps(s)
        else:
            r = []
        if not r: r = _parse_json_ld(s)
        if not r: r = _parse_generic(s)
        return r

    # Parse first page
    all_reviews = _parse_html(html)
    seen_texts  = {rv["text"][:80] for rv in all_reviews}

    # Paginate — keep fetching until we have 300 or run out of pages
    if len(all_reviews) < 300:
        page_urls = _build_page_urls(url, domain, max_pages=12)
        for purl in page_urls:
            if len(all_reviews) >= 300:
                break
            phtml, perr = _fetch_direct(purl)
            if not phtml and WEBSCRAPING_AI_KEY:
                phtml, perr = _fetch_via_webscrapingai(purl, render_js=True)
            if not phtml:
                break  # no more pages accessible
            page_reviews = _parse_html(phtml)
            if not page_reviews:
                break  # empty page means we hit the end
            added = 0
            for rv in page_reviews:
                key = rv["text"][:80]
                if key not in seen_texts:
                    seen_texts.add(key)
                    all_reviews.append(rv)
                    added += 1
            if added == 0:
                break  # duplicate page = end of reviews
            time.sleep(0.4)

    if not all_reviews:
        return {
            "scraped": False, "reviews": [], "count": 0,
            "error": "no_reviews_found",
            "message": (f"Page loaded from {domain} but no review text detected. "
                        f"The site likely loads reviews via JavaScript after the page loads. "
                        f"Try exporting reviews as CSV and uploading instead."),
            "method": method,
        }

    cleaned = [{"text": re.sub(r'\s+', ' ', rv["text"].strip()), **{k:v for k,v in rv.items() if k != "text"}} for rv in all_reviews if len(rv.get("text","").strip()) > 15]
    via = f" via {method}" if method != "direct" else ""
    return {
        "scraped": True,
        "reviews": cleaned[:300],
        "count":   len(cleaned[:300]),
        "error":   None,
        "message": f"Scraped {len(cleaned[:300])} reviews from {domain}{via}",
        "method":  method,
    }
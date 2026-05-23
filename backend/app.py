from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import joblib
import re
import nltk
import numpy as np
import requests
from bs4 import BeautifulSoup
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords

nltk.download('wordnet', quiet=True)
nltk.download('stopwords', quiet=True)

lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))

def preprocess(text):
    if not isinstance(text, str):
        return ""
    text = text.lower()
    text = re.sub(r'http\S+', ' url ', text)
    text = re.sub(r'\$[\d,]+', ' salary_mentioned ', text)
    text = re.sub(r'[^a-z\s]', ' ', text)
    tokens = text.split()
    tokens = [lemmatizer.lemmatize(t) for t in tokens if t not in stop_words and len(t) > 2]
    return ' '.join(tokens)

app = Flask(__name__)
app.config['CORS_HEADERS'] = 'Content-Type'
CORS(app, resources={r"/*": {"origins": "*"}})

limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://"
)

model = joblib.load('model_v2.pkl')
vectorizer = joblib.load('vectorizer_v2.pkl')

RED_FLAGS = [
    "no experience needed", "work from home", "be your own boss",
    "unlimited earning", "immediate joiner", "urgent hiring",
    "no interview", "guaranteed job", "wire transfer", "western union",
    "send money", "processing fee", "registration fee", "training fee",
    "whatsapp only", "no degree required", "earn from home",
    "daily payment", "weekly payment", "multi level", "mlm",
    "no stipend", "unpaid internship", "no salary", "pay to learn",
    "curated programs",
]

PRESSURE_WORDS = [
    "urgent", "immediate", "asap", "limited seats", "apply now",
    "don't miss", "last chance", "hurry", "today only"
]

def detect_red_flags(text):
    text_lower = text.lower()
    return [flag for flag in RED_FLAGS if flag in text_lower]

def desperation_score(text):
    text_lower = text.lower()
    hits = [w for w in PRESSURE_WORDS if w in text_lower]
    return min(len(hits) * 20, 100), hits

def confidence_interval(fake_prob, text_length):
    # Shorter text = less confident = wider interval
    if text_length < 100:
        margin = 15
    elif text_length < 300:
        margin = 10
    elif text_length < 600:
        margin = 6
    else:
        margin = 3

    lower = round(max(0, fake_prob - margin), 1)
    upper = round(min(100, fake_prob + margin), 1)

    if fake_prob >= 85 or fake_prob <= 15:
        confidence = "High"
    elif fake_prob >= 60 or fake_prob <= 40:
        confidence = "Medium"
    else:
        confidence = "Low"

    return lower, upper, confidence

def scrape_url(url):
    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
        res = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(res.text, 'html.parser')
        for tag in soup(['script', 'style', 'nav', 'header', 'footer']):
            tag.decompose()
        text = soup.get_text(separator=' ', strip=True)
        text = re.sub(r'\s+', ' ', text)
        return text[:5000]
    except:
        return None

def verify_company(company_name):
    if not company_name:
        return {"verified": False, "reason": "No company name provided"}
    try:
        query = company_name.replace(' ', '+')
        headers = {'User-Agent': 'Mozilla/5.0'}
        res = requests.get(f'https://www.google.com/search?q={query}+company+official+site', headers=headers, timeout=8)
        soup = BeautifulSoup(res.text, 'html.parser')
        results = soup.find_all('cite')
        domains = [r.text for r in results[:5]]
        name_lower = company_name.lower().replace(' ', '')
        matched = any(name_lower[:6] in d.lower() for d in domains)
        return {
            "verified": matched,
            "domains_found": domains[:3],
            "reason": "Found matching web presence" if matched else "No strong web presence found"
        }
    except:
        return {"verified": False, "reason": "Could not verify"}

@app.route('/scrape', methods=['POST'])
@limiter.limit("20 per hour")
def scrape():
    data = request.json
    url = data.get('url', '')
    if not url:
        return jsonify({'error': 'No URL provided'}), 400
    text = scrape_url(url)
    if not text:
        return jsonify({'error': 'Could not scrape URL'}), 400
    return jsonify({'text': text})

@app.route('/analyze', methods=['POST'])
@limiter.limit("30 per hour")
def analyze():
    data = request.json
    jd_text = data.get('text', '')

    if not jd_text.strip():
        return jsonify({'error': 'No text provided'}), 400

    vec = vectorizer.transform([preprocess(jd_text)])
    prob = model.predict_proba(vec)[0]
    fake_prob = round(float(prob[1]) * 100, 1)
    real_prob = round(float(prob[0]) * 100, 1)

    lower, upper, confidence = confidence_interval(fake_prob, len(jd_text))

    if fake_prob < 30:
        verdict = "Likely Legit"
        color = "green"
    elif fake_prob < 60:
        verdict = "Suspicious"
        color = "yellow"
    else:
        verdict = "Likely Fake"
        color = "red"

    red_flags = detect_red_flags(jd_text)
    desp_score, pressure_words = desperation_score(jd_text)

    company_name = data.get('company_name', '')
    company_info = verify_company(company_name) if company_name else None

    return jsonify({
        'fake_probability': fake_prob,
        'real_probability': real_prob,
        'confidence_interval': {'lower': lower, 'upper': upper},
        'confidence_level': confidence,
        'verdict': verdict,
        'color': color,
        'red_flags': red_flags,
        'desperation_score': desp_score,
        'pressure_words': pressure_words,
        'company_verification': company_info,
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'})

@app.errorhandler(429)
def ratelimit_handler(e):
    return jsonify({'error': 'Rate limit exceeded. Try again later.', 'retry_after': str(e.description)}), 429

if __name__ == '__main__':
    app.run(debug=True, port=5001)
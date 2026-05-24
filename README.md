# Jobveritas 🔍
### Is that job real? Find out in seconds.

Jobveritas uses machine learning to detect fake job postings. Paste a job description or drop a URL — get an instant verdict with red flag analysis, company verification, and confidence scores.

## What it does

- Fake job detection — ML model trained on 18,000 real and fake job postings
- Red flag highlighter — suspicious phrases highlighted directly in the text
- URL scraper — paste a LinkedIn/Naukri/Indeed link, it fetches the JD automatically
- Company verifier — checks if the company has a real web presence
- Pressure tactics detector — catches urgency language like "apply now", "urgent hiring"
- Confidence intervals — tells you how certain the prediction is
- History — saves your last 10 analyses

## Tech Stack

- Frontend: React
- Backend: Python + Flask
- ML Model: Ensemble (Random Forest + Logistic Regression)
- NLP: TF-IDF + NLTK lemmatization
- Dataset: Kaggle, 18,000 job postings
- Accuracy: 99%

## Run locally

Backend:
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 train_model.py
python3 app.py

Frontend:
cd frontend
npm install
npm start

## License
MIT License — Copyright 2026 Tanya

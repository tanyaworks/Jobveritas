import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.metrics import classification_report
from sklearn.utils import resample
import joblib
import re
import nltk
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

print("Loading dataset...")
df = pd.read_csv('fake_job_postings.csv')

df['text'] = (
    df['title'].fillna('') + ' ' +
    df['company_profile'].fillna('') + ' ' +
    df['description'].fillna('') + ' ' +
    df['requirements'].fillna('') + ' ' +
    df['benefits'].fillna('')
)

print("Preprocessing...")
df['text'] = df['text'].apply(preprocess)

real = df[df['fraudulent'] == 0]
fake = df[df['fraudulent'] == 1]
fake_upsampled = resample(fake, replace=True, n_samples=len(real), random_state=42)
df_balanced = pd.concat([real, fake_upsampled])

X = df_balanced['text']
y = df_balanced['fraudulent']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

vectorizer = TfidfVectorizer(max_features=15000, ngram_range=(1,3), sublinear_tf=True)
X_train_vec = vectorizer.fit_transform(X_train)
X_test_vec = vectorizer.transform(X_test)

print("Training ensemble...")
lr = LogisticRegression(max_iter=1000, C=1.0)
rf = RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)
ensemble = VotingClassifier(estimators=[('lr', lr), ('rf', rf)], voting='soft')
ensemble.fit(X_train_vec, y_train)

y_pred = ensemble.predict(X_test_vec)
print(classification_report(y_test, y_pred))

joblib.dump(ensemble, 'model_v2.pkl')
joblib.dump(vectorizer, 'vectorizer_v2.pkl')
print("Done! Saved model_v2.pkl and vectorizer_v2.pkl")
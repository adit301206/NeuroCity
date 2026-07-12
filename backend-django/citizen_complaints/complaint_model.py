# complaint_model.py
import pandas as pd
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
import joblib

def train_pipeline():
    # Look for the dataset out in the root directory
    dataset_path = '../complaints_dataset.csv'
    
    if not os.path.exists(dataset_path):
        # Fallback to local path if already copied inside the app directory
        dataset_path = 'complaints_dataset.csv'
        if not os.path.exists(dataset_path):
            print("❌ Error: complaints_dataset.csv not found anywhere!")
            return

    # 1. Load data
    df = pd.read_csv(dataset_path)
    df = df.dropna(subset=['complaint_text', 'category'])
    
    # Force lowercase and remove any stray spaces from category names
    df['category'] = df['category'].str.strip()

    X = df['complaint_text']
    y = df['category']

    print(f"📊 Training on {len(df)} rows across classes:")
    print(y.value_counts())

    # 2. Extract explicit parameters (lower n-grams helps match single target words like 'streetlights')
    vectorizer = TfidfVectorizer(stop_words='english', lowercase=True)
    X_vec = vectorizer.fit_transform(X)

    # 3. Fit Random Forest
    classifier = RandomForestClassifier(n_estimators=100, random_state=42, class_weight='balanced')
    classifier.fit(X_vec, y)

    # 4. Save EXACTLY inside the app folder
    joblib.dump(vectorizer, 'tfidf_vectorizer.pkl')
    joblib.dump(classifier, 'triage_rf_model.pkl')
    
    print("✨ Clean binaries written successfully inside citizen_complaints directory!")

if __name__ == "__main__":
    train_pipeline()
# complaint_model.py
import pandas as pd
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
import joblib

def train_pipeline():
    # Target path adjustment to point out to your data file
    dataset_path = '../complaints_dataset.csv'
    if not os.path.exists(dataset_path):
        dataset_path = 'complaints_dataset.csv'
        if not os.path.exists(dataset_path):
            print("❌ Error: complaints_dataset.csv not found anywhere!")
            return

    # 1. Load data
    df = pd.read_csv(dataset_path)
    df = df.dropna(subset=['complaint_text', 'category'])
    
    # Strip any hidden whitespaces from labels
    df['category'] = df['category'].str.strip()

    X = df['complaint_text']
    y = df['category']

    print(f"🌲 Training High-Accuracy SVM Pipeline over {len(df)} entries...")

    # 2. UPGRADE: Extract Unigrams, Bigrams, and Trigrams (ngram_range=(1, 3))
    # sublinear_tf scales feature density down logarithmically to handle long descriptions smoothly
    vectorizer = TfidfVectorizer(
        stop_words='english', 
        lowercase=True, 
        ngram_range=(1, 3), 
        sublinear_tf=True
    )
    X_vec = vectorizer.fit_transform(X)

    # 3. UPGRADE: Switch Classifier to Linear Support Vector Machine (LinearSVC)
    # This draws perfect separating hyperplanes across text clusters
    classifier = LinearSVC(C=1.0, class_weight='balanced', random_state=42, dual=False)
    classifier.fit(X_vec, y)

    # 4. Overwrite Saved Binary Serialization Files inside app path
    joblib.dump(vectorizer, 'tfidf_vectorizer.pkl')
    joblib.dump(classifier, 'triage_rf_model.pkl') # Keep name matching complaints_engine.py loads
    
    print("✨ Production NLP Engine rebuilt and optimized successfully!")

if __name__ == "__main__":
    train_pipeline()
# complaint_model.py
import pandas as pd
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib

def train_pipeline():
    # Adjust path if data sits out in parent directory root
    dataset_path = '../complaints_dataset.csv'
    if not os.path.exists(dataset_path):
        dataset_path = 'complaints_dataset.csv'
        if not os.path.exists(dataset_path):
            print("❌ Error: complaints_dataset.csv not found anywhere!")
            return

    # 1. Load Data Frame Core
    df = pd.read_csv(dataset_path)
    df = df.dropna(subset=['complaint_text', 'category'])
    
    # Strip whitespace to align string configurations
    df['category'] = df['category'].str.strip()

    X = df['complaint_text']
    y = df['category']

    print(f"📊 High-Volume Core Activated! Total loaded rows: {len(df)}")
    print("📈 Matrix Row Distribution Per Department Category:")
    print(y.value_counts())

    # 2. Split into Train & Local Validation holds (85% Train, 15% Validation Check)
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.15, random_state=42, stratify=y
    )

    # 3. Text Vector Extraction via n-gram tuning
    # With 100 rows per category, standard unigram + bigram (1, 2) handles sequences smoothly
    vectorizer = TfidfVectorizer(
        stop_words='english', 
        lowercase=True, 
        ngram_range=(1, 2),
        sublinear_tf=True
    )
    
    X_train_vec = vectorizer.fit_transform(X_train)
    X_val_vec = vectorizer.transform(X_val)

    # 4. Supervised Training Optimization Loop (Linear Support Vector Machine)
    classifier = LinearSVC(C=0.5, class_weight='balanced', random_state=42, dual=False)
    classifier.fit(X_train_vec, y_train)

    # 5. Local Analytical Validation Check
    val_predictions = classifier.predict(X_val_vec)
    score = accuracy_score(y_val, val_predictions)
    
    print("\n" + "="*75)
    print(f"🎯 LOCAL TRAIN-VALIDATION DATA HOLD ACCURACY: {score * 100:.2f}%")
    print("="*75)
    print(classification_report(y_val, val_predictions))
    print("="*75)

    # 6. Fit over 100% of rows before final production export
    print("💾 Training complete! Refitting final weights on the full 100% corpus pool...")
    X_full_vec = vectorizer.fit_transform(X)
    classifier.fit(X_full_vec, y)

    # Overwrite binary dump outputs inside your application folder
    joblib.dump(vectorizer, 'tfidf_vectorizer.pkl')
    joblib.dump(classifier, 'triage_rf_model.pkl')
    
    print("✨ Production NLP Engine successfully saved onto disk storage targets.")

if __name__ == "__main__":
    train_pipeline()
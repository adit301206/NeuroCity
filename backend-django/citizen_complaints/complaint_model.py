# train_triage_model.py
import pandas as pd
import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import joblib

def train_pipeline():
    # Use the expanded complaints file path
    dataset_path = 'complaints_dataset.csv'
    
    if not os.path.exists(dataset_path):
        print(f"❌ Error: {dataset_path} not found. Ensure it is placed in the root of your Django microservice.")
        return

    # 1. Load the generated dataset
    print("⏳ Loading civic complaints data matrix...")
    df = pd.read_csv(dataset_path)
    
    # Drop any corrupt rows safely
    df = df.dropna(subset=['complaint_text', 'category'])

    # 2. Extract Data Split (X = Features, y = Targeted Labels)
    X = df['complaint_text']
    y = df['category']

    # Log distribution stats for presentation visibility
    print(f"📊 Total processed records found: {len(df)}")
    print(y.value_counts())

    # Split for local validation checks (80% training, 20% testing data)
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    # 3. Vectorize Text via TF-IDF (Term Frequency-Inverse Document Frequency)
    # This transforms alphanumeric text phrases into dense mathematical space vectors
    print("🧮 Fitting TF-IDF Vectorizer (Unigrams & Bigrams)...")
    vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2), min_df=2)
    X_train_vec = vectorizer.fit_transform(X_train)
    X_test_vec = vectorizer.transform(X_test)

    # 4. Train the Random Forest Model 
    print("🌲 Training Random Forest Classifier heads...")
    classifier = RandomForestClassifier(n_estimators=200, random_state=42, max_depth=25, class_weight='balanced')
    classifier.fit(X_train_vec, y_train)

    # 5. Evaluate training accuracy metric profiles
    predictions = classifier.predict(X_test_vec)
    print("\n📈 Model Evaluation Analytics Dashboard Report:")
    print(classification_report(y_test, predictions))

    # 6. Save binary serialization files for production hot-loading
    print("💾 Exporting model artifacts to production workspace bins...")
    joblib.dump(vectorizer, 'tfidf_vectorizer.pkl')
    joblib.dump(classifier, 'triage_rf_model.pkl')
    
    print("✨ Compilation complete! Artifacts 'tfidf_vectorizer.pkl' and 'triage_rf_model.pkl' are active.")

if __name__ == "__main__":
    train_pipeline()
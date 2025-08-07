
import joblib
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score
import sqlite3
import os
import sys
# import datetime # Removed datetime
# import time # Removed time

from preprocess_text import custom_tokenizer, stemmer, lemmatizer

def load_data(db_path):
    conn = sqlite3.connect(db_path)
    query = "SELECT payee, description, amount, account_id, category FROM transactions WHERE category IS NOT NULL AND category != 'Uncategorized'"
    df = pd.read_sql_query(query, conn)
    conn.close()
    return df

def preprocess_data(df):
    # Handle missing values by filling with empty string for text fields
    df['payee'] = df['payee'].fillna('')
    df['description'] = df['description'].fillna('')

    # TF-IDF for payee and description (shared vocabulary)
    df['combined_text'] = df['payee'] + " " + df['description']
    tfidf_combined = TfidfVectorizer(max_features=10000, analyzer='char_wb', ngram_range=(2, 7))
    combined_features = tfidf_combined.fit_transform(df['combined_text'])
    combined_feature_names = [f"combined_tfidf_{i}" for i in range(combined_features.shape[1])]
    combined_df = pd.DataFrame(combined_features.toarray(), columns=combined_feature_names, index=df.index)

    # Label Encoding for account
    le_account = LabelEncoder()
    df['account_encoded'] = le_account.fit_transform(df['account_id'])

    # Normalize the 'amount' column
    scaler_amount = StandardScaler()
    df['amount_scaled'] = scaler_amount.fit_transform(df[['amount']])

    # Combine all features
    features_df = pd.concat([combined_df, df[['amount_scaled', 'account_encoded']]], axis=1)
    
    # Target variable
    labels = df['category']

    return features_df, labels, tfidf_combined, le_account, scaler_amount

if __name__ == "__main__":
    # Download NLTK resources
    # nltk.download('punkt', quiet=True) # Removed nltk download
    # nltk.download('wordnet', quiet=True) # Removed nltk download
    # nltk.download('punkt_tab', quiet=True) # Removed nltk download

    db_path = sys.argv[1] if len(sys.argv) > 1 else "./data/user_data.db" # Default path if not provided
    data = load_data(db_path)
    print(f"Loaded {len(data)} rows with categories for training.")
    
    model_save_dir = sys.argv[2] if len(sys.argv) > 2 else "model"
    
    if not data.empty:
        features, labels, tfidf_combined, le_account, scaler_amount = preprocess_data(data) # Get all returned objects

        # Split data into training and testing sets (80/20 split as requested earlier)
        X_train, X_test, y_train, y_test = train_test_split(features, labels, test_size=0.2, random_state=42)
        
        print(f"\nTraining set shape: {X_train.shape}")
        print(f"Testing set shape: {X_test.shape}")

        # Train a RandomForestClassifier model
        model = RandomForestClassifier(n_estimators=100, random_state=42)
        model.fit(X_train, y_train)

        # Make predictions and evaluate the model
        y_pred = model.predict(X_test)
        
        print("\nModel Accuracy:", accuracy_score(y_test, y_pred)) # Changed accuracy_score to accuracy_score
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))

        # Classify a random data point
        if not X_test.empty:
            random_index = X_test.sample(1).index[0]
            random_data_point = X_test.loc[random_index]
            actual_category = y_test.loc[random_index]

            # Predict for the single data point
            predicted_category = model.predict(random_data_point.values.reshape(1, -1))[0]
            prediction_proba = model.predict_proba(random_data_point.values.reshape(1, -1))[0]
            predicted_category_index = model.classes_.tolist().index(predicted_category)
            confidence = prediction_proba[predicted_category_index]

            print(f"\n--- Random Data Point Classification ---")
            print(f"Original Transaction Index: {random_index}")
            print(f"Actual Category: {actual_category}")
            print(f"Predicted Category: {predicted_category}")
            print(f"Prediction Confidence: {confidence:.2f}") # Print confidence with 2 decimal places
        else:
            print("\nNo test data available for random classification.")

        # Save the trained model and preprocessing objects
        model_dir = model_save_dir
        os.makedirs(model_dir, exist_ok=True) # Ensure the directory exists
        model_filename = os.path.join(model_dir, "category_classifier_model.joblib")
        tfidf_filename = os.path.join(model_dir, "tfidf_vectorizer.joblib")
        account_encoder_filename = os.path.join(model_dir, "account_label_encoder.joblib")
        amount_scaler_filename = os.path.join(model_dir, "amount_scaler.joblib")

        joblib.dump(model, model_filename)
        joblib.dump(tfidf_combined, tfidf_filename)
        joblib.dump(le_account, account_encoder_filename)
        joblib.dump(scaler_amount, amount_scaler_filename)

        print(f"\nModel saved to {model_filename}")
        print(f"TF-IDF vectorizer saved to {tfidf_filename}")
        print(f"Account LabelEncoder saved to {account_encoder_filename}")
        print(f"Amount StandardScaler saved to {amount_scaler_filename}")

    else:
        print("No data to preprocess or train model.") 
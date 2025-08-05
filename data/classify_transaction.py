import joblib
import pandas as pd
import nltk
from nltk.stem import PorterStemmer, WordNetLemmatizer
from nltk.tokenize import word_tokenize
import os
import sqlite3
import sys # Import sys for command-line arguments

# Initialize stemmer and lemmatizer globally (must match train_model.py)
stemmer = PorterStemmer()
lemmatizer = WordNetLemmatizer()

# Custom tokenizer (must match train_model.py)
def custom_tokenizer(text):
    tokens = word_tokenize(text.lower())
    lemmas = [lemmatizer.lemmatize(word) for word in tokens]
    return [stemmer.stem(word) for word in lemmas]

def load_model_and_preprocessors(model_dir="model"):
    model_path = os.path.join(model_dir, "category_classifier_model.joblib")
    tfidf_path = os.path.join(model_dir, "tfidf_vectorizer.joblib")
    account_encoder_path = os.path.join(model_dir, "account_label_encoder.joblib")
    amount_scaler_path = os.path.join(model_dir, "amount_scaler.joblib")

    try:
        model = joblib.load(model_path)
        tfidf_combined = joblib.load(tfidf_path)
        le_account = joblib.load(account_encoder_path)
        scaler_amount = joblib.load(amount_scaler_path)
        return model, tfidf_combined, le_account, scaler_amount
    except FileNotFoundError as e:
        print(f"Error loading saved objects: {e}. Make sure train_model.py has been run and saved the models.")
        return None, None, None, None

def classify_new_transaction(payee, description, amount, account_id, model, tfidf_combined, le_account, scaler_amount):
    # Create a DataFrame for the new transaction
    new_df = pd.DataFrame([{
        'payee': payee,
        'description': description,
        'amount': amount,
        'account_id': account_id
    }])

    # Preprocess the new data using the loaded transformers
    new_df['payee'] = new_df['payee'].fillna('')
    new_df['description'] = new_df['description'].fillna('')

    new_df['combined_text'] = new_df['payee'] + " " + new_df['description']
    new_combined_features = tfidf_combined.transform(new_df['combined_text'])
    new_combined_df = pd.DataFrame(new_combined_features.toarray(), columns=tfidf_combined.get_feature_names_out(), index=new_df.index)

    new_df['account_encoded'] = le_account.transform(new_df['account_id'])
    new_df['amount_scaled'] = scaler_amount.transform(new_df[['amount']])

    # Combine all features for the new data point
    new_features_df = pd.concat([new_combined_df, new_df[['amount_scaled', 'account_encoded']]], axis=1)

    # Make prediction
    predicted_category = model.predict(new_features_df)[0]
    prediction_proba = model.predict_proba(new_features_df)[0]
    
    # Get confidence for the predicted category
    predicted_category_index = list(model.classes_).index(predicted_category)
    confidence = prediction_proba[predicted_category_index]

    return predicted_category, confidence

def update_transaction_category_in_db(db_path, transaction_id, category):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    try:
        cursor.execute("UPDATE transactions SET category = ? WHERE id = ?", (category, transaction_id))
        conn.commit()
        print(f"Updated transaction ID {transaction_id} with category '{category}'")
    except sqlite3.Error as e:
        print(f"Database error updating transaction ID {transaction_id}: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    # Download NLTK resources if not already present (important for custom_tokenizer)
    nltk.download('punkt', quiet=True)
    nltk.download('wordnet', quiet=True)
    nltk.download('punkt_tab', quiet=True)

    if len(sys.argv) < 2:
        print("Usage: python classify_transaction.py <start_date_YYYY-MM-DD>")
        sys.exit(1)

    start_date = sys.argv[1]
    db_path = "user_data.db"

    print("Loading model and preprocessors...")
    model, tfidf_combined, le_account, scaler_amount = load_model_and_preprocessors("data/")

    if model and tfidf_combined and le_account and scaler_amount:
        print("Model and preprocessors loaded successfully.\n")

        conn = None
        try:
            conn = sqlite3.connect(db_path)
            query = "SELECT id, payee, description, amount, account_id, date FROM transactions WHERE category IS NULL AND date >= ?"
            uncategorized_df = pd.read_sql_query(query, conn, params=(start_date,))
            
            if not uncategorized_df.empty:
                print(f"Found {len(uncategorized_df)} uncategorized transactions since {start_date}.\n")
                updated_count = 0
                for index, row in uncategorized_df.iterrows():
                    transaction_id = row['id']
                    payee = row['payee']
                    description = row['description']
                    amount = row['amount']
                    account_id = row['account_id']
                    date = row['date']

                    predicted_category, confidence = classify_new_transaction(
                        payee, description, amount, account_id, model, tfidf_combined, le_account, scaler_amount
                    )

                    print(f"Transaction ID: {transaction_id}, Date: {date}, Payee: {payee}, Desc: {description[:30]}...")
                    print(f"  Predicted: {predicted_category}, Confidence: {confidence:.2f}")

                    if confidence > 0.70:
                        update_transaction_category_in_db(db_path, transaction_id, predicted_category)
                        updated_count += 1
                        print(f"  -> Auto-categorized as '{predicted_category}' (Confidence: {confidence:.2f})\n")
                    else:
                        print(f"  -> Not auto-categorized (Confidence too low: {confidence:.2f})\n")
                print(f"Finished processing. {updated_count} transactions were auto-categorized.")
            else:
                print(f"No uncategorized transactions found since {start_date}.")

        except sqlite3.Error as e:
            print(f"Database error: {e}")
        finally:
            if conn: # Ensure connection is closed even if error occurs
                conn.close()

    else:
        print("Could not load all necessary components. Please ensure train_model.py has been run successfully.")
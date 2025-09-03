import joblib
import pandas as pd
import os
import sqlite3
import sys
import datetime
import nltk
import json

from preprocess_text import custom_tokenizer, stemmer, lemmatizer

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
    # Rename columns to match the training feature names
    new_combined_df.columns = [f"combined_tfidf_{i}" for i in range(new_combined_df.shape[1])]

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

def predict_top_k_categories(payee, description, amount, account_id, model, tfidf_combined, le_account, scaler_amount, k=3):
    new_df = pd.DataFrame([{
        'payee': payee,
        'description': description,
        'amount': amount,
        'account_id': account_id
    }])

    new_df['payee'] = new_df['payee'].fillna('')
    new_df['description'] = new_df['description'].fillna('')

    new_df['combined_text'] = new_df['payee'] + " " + new_df['description']
    new_combined_features = tfidf_combined.transform(new_df['combined_text'])
    new_combined_df = pd.DataFrame(new_combined_features.toarray(), columns=tfidf_combined.get_feature_names_out(), index=new_df.index)
    new_combined_df.columns = [f"combined_tfidf_{i}" for i in range(new_combined_df.shape[1])]

    new_df['account_encoded'] = le_account.transform(new_df['account_id'])
    new_df['amount_scaled'] = scaler_amount.transform(new_df[['amount']])

    new_features_df = pd.concat([new_combined_df, new_df[['amount_scaled', 'account_encoded']]], axis=1)

    proba = model.predict_proba(new_features_df)[0]
    classes = list(model.classes_)
    ranked = sorted(zip(classes, proba), key=lambda x: x[1], reverse=True)[:k]
    return [(c, float(p)) for c, p in ranked]

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
        print("Usage: python classify_transaction.py <start_timestamp> | --ids id1,id2,id3 | --topk payee description amount account_id")
        sys.exit(1)

    use_ids_mode = False
    provided_ids = []
    start_timestamp = None

    if sys.argv[1] == '--ids':
        if len(sys.argv) < 3:
            print("When using --ids, provide a comma-separated list of IDs.")
            sys.exit(1)
        ids_arg = sys.argv[2]
        provided_ids = [i.strip() for i in ids_arg.split(',') if i.strip()]
        if not provided_ids:
            print("No valid IDs provided.")
            sys.exit(1)
        use_ids_mode = True
    elif sys.argv[1] == '--topk':
        if len(sys.argv) < 6:
            print("When using --topk, provide payee, description, amount, account_id")
            sys.exit(1)
        payee = sys.argv[2]
        description = sys.argv[3]
        try:
            amount = float(sys.argv[4])
        except ValueError:
            amount = 0.0
        account_id = sys.argv[5]

        # Load model and preprocessors (quiet, JSON-only output below)
        model, tfidf_combined, le_account, scaler_amount = load_model_and_preprocessors("model/")
        if not (model and tfidf_combined and le_account and scaler_amount):
            print(json.dumps({"error": "Model not available"}))
            sys.exit(1)
        topk = predict_top_k_categories(payee, description, amount, account_id, model, tfidf_combined, le_account, scaler_amount, k=3)
        output = {"predictions": [{"category": c, "confidence": p} for c, p in topk]}
        print(json.dumps(output))
        sys.exit(0)
    else:
        # Directly use the timestamp from command-line argument (legacy mode)
        try:
            start_timestamp = int(sys.argv[1])
        except ValueError:
            print(f"Invalid timestamp: {sys.argv[1]}. Please provide an integer Unix timestamp.")
            sys.exit(1)

    db_path = "user_data.db"

    print("Loading model and preprocessors...")
    model, tfidf_combined, le_account, scaler_amount = load_model_and_preprocessors("model/")

    if model and tfidf_combined and le_account and scaler_amount:
        print("Model and preprocessors loaded successfully.\n")

        conn = None
        try:
            conn = sqlite3.connect(db_path)
            if use_ids_mode:
                placeholders = ",".join(["?"] * len(provided_ids))
                query = f"SELECT id, payee, description, amount, account_id, posted FROM transactions WHERE category = 'Uncategorized' AND id IN ({placeholders})"
                uncategorized_df = pd.read_sql_query(query, conn, params=tuple(provided_ids))
                context_desc = f"IDs list ({len(provided_ids)} provided)"
            else:
                # Query using posted column and integer timestamp directly
                query = "SELECT id, payee, description, amount, account_id, posted FROM transactions WHERE category = 'Uncategorized' AND posted >= ?"
                uncategorized_df = pd.read_sql_query(query, conn, params=(start_timestamp,))
                context_desc = f"timestamp {start_timestamp}"
            
            if not uncategorized_df.empty:
                print(f"Found {len(uncategorized_df)} uncategorized transactions for {context_desc}.\n")
                updated_count = 0
                for _, row in uncategorized_df.iterrows():
                    transaction_id = row['id']
                    payee = row['payee']
                    description = row['description']
                    amount = row['amount']
                    account_id = row['account_id']
                    posted_at = row['posted']  # Get posted timestamp

                    predicted_category, confidence = classify_new_transaction(
                        payee, description, amount, account_id, model, tfidf_combined, le_account, scaler_amount
                    )

                    readable_date = datetime.datetime.fromtimestamp(posted_at).strftime('%Y-%m-%d')
                    print(f"Transaction ID: {transaction_id}, Date: {readable_date}, Payee: {payee}, Desc: {description[:30]}...")
                    print(f"  Predicted: {predicted_category}, Confidence: {confidence:.2f}")

                    if confidence > 0.80:
                        update_transaction_category_in_db(db_path, transaction_id, predicted_category)
                        updated_count += 1
                        print(f"  -> Auto-categorized as '{predicted_category}' (Confidence: {confidence:.2f})\n")
                    else:
                        print(f"  -> Not auto-categorized (Confidence too low: {confidence:.2f})\n")
                print(f"Finished processing. {updated_count} transactions were auto-categorized.")
            else:
                print(f"No uncategorized transactions found for {context_desc}.")

        except sqlite3.Error as e:
            print(f"Database error: {e}")
        finally:
            if conn:
                conn.close()

    else:
        print("Could not load all necessary components. Please ensure train_model.py has been run successfully.")
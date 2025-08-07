import nltk
from nltk.stem import PorterStemmer, WordNetLemmatizer
from nltk.tokenize import word_tokenize

# Initialize stemmer and lemmatizer globally
stemmer = PorterStemmer()
lemmatizer = WordNetLemmatizer()

# Custom tokenizer
def custom_tokenizer(text):
    tokens = word_tokenize(text.lower())
    # Filter out non-alphanumeric single characters and empty strings
    filtered_tokens = [word for word in tokens if word.isalnum() and len(word) > 1 or word.isdigit()]
    lemmas = [lemmatizer.lemmatize(word) for word in filtered_tokens]
    return [stemmer.stem(word) for word in lemmas]
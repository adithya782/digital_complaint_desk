import os
import pickle
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

# Import your Flask app instance, DB context, and models
# (Adjust the import statement if your main Flask file is named something other than app.py)
from models import Complaint, Department

def train_model_from_database():
    from app import app, db

    print("⏳ Connecting to database and extracting admin-verified training data...")
    
    # 1. Open the Flask application context
    # This allows SQLAlchemy to run queries independently of an incoming web request route.
    with app.app_context():
        # Query verified complaints and perform an inner JOIN with the Department master table
        # to fetch the actual text names (labels) for our machine learning model.
        query_results = db.session.query(Complaint, Department).join(
            Department, Complaint.department_id == Department.department_id
        ).filter(Complaint.is_verified == True).all()
        
        if not query_results:
            print("⚠️ Training Halted: Zero admin-verified complaints found in the database.")
            print("💡 Go to your admin dashboard and verify some tickets to build your training set!")
            return False
            
        if len(query_results) < 10:
            print(f"⚠️ Training Halted: Found only {len(query_results)} verified records.")
            print("💡 For stable text classification, a minimum of 10 verified records is recommended.")
            return False
            
        # Parse the SQLAlchemy joined tuples cleanly into a structural dictionary array
        training_dataset = [{
            'description': complaint.description,
            'department_name': department.department_name  # The textual string category target for the AI
        } for complaint, department in query_results]
        
        # Convert into a Pandas DataFrame for easy tokenization manipulation
        df = pd.DataFrame(training_dataset)

    print(f"📊 Extraction successful! Collected {len(df)} verified training coordinates.")
    
    # 2. Separate features (X) and ground-truth targets (y)
    X = df['description']
    y = df['department_name']
    
    # Validation Safeguard: Check that the training records span across at least two distinct sectors
    if len(y.unique()) < 2:
        print("🛑 Training Halted: All verified records belong to the exact same department.")
        print(f"Current unique category footprint: {list(y.unique())}")
        print("The AI cannot calculate boundaries if it only knows about one department type!")
        return False

    # 3. Build the Text Processing & Machine Learning Pipeline
    # TfidfVectorizer converts human language strings into optimized numerical frequency matrices.
    # LogisticRegression maps those vectors to the correct municipal department class.
    model_pipeline = Pipeline([
        ('vectorizer', TfidfVectorizer(
            stop_words='english',     # Filters out filler words (e.g., 'the', 'is', 'at')
            ngram_range=(1, 2),       # Captures both single words ("leak") and word-pairs ("water leak")
            sublinear_tf=True         # Dampens the impact of long-winded, repetitive complaints
        )),
        ('classifier', LogisticRegression(
            C=1.0,                    # Standard structural regularizer strength metric
            max_iter=1000,            # High ceiling to guarantee gradient descent convergence safety
            class_weight='balanced'   # Compensates if one department has significantly more issues logged than another
        ))
    ])
    
    # 4. Fit the Pipeline Weights
    print("🧠 Re-fitting mathematical boundaries and tuning vocabulary weights...")
    model_pipeline.fit(X, y)
    
    # 5. Overwrite the deployment pickle bundle file safely
    model_pickle_path = 'complaint_classifier.pkl'
    try:
        with open(model_pickle_path, 'wb') as model_file:
            pickle.dump(model_pipeline, f"model_file")
        print(f"🚀 Success! Freshly trained intelligence pipeline exported to '{model_pickle_path}'.")
        return True
    except Exception as e:
        print(f"🛑 File System Error: Failed to write pickle file. Details: {str(e)}")
        return False

if __name__ == '__main__':
    train_model_from_database()
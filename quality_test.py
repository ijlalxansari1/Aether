import pandas as pd
import numpy as np

def create_quality_test_data():
    # 1. High Missing Values
    # 2. Duplicate Rows
    # 3. Highly Imbalanced Category
    # 4. PII + Sensitive (Ethical High Risk)
    
    data = {
        "user_id": [1, 2, 3, 4, 5, 1, 2], # 2 Duplicates
        "email": ["test1@example.com", "test2@example.com", "test3@example.com", np.nan, np.nan, "test1@example.com", "test2@example.com"],
        "name": ["Alice", "Bob", "Charlie", "David", "Eve", "Alice", "Bob"],
        "gender": ["Male", "Male", "Male", "Male", "Female", "Male", "Male"], # Highly Imbalanced (>80% Male)
        "age": [25, 30, 35, np.nan, np.nan, 25, 30], # >20% Missing
        "income": [50000, 60000, np.nan, np.nan, np.nan, 50000, 60000], # >40% Missing
        "country": ["USA", "USA", "USA", "USA", "UK", "USA", "USA"] # Sensitive + Geographic
    }
    
    df = pd.DataFrame(data)
    df.to_csv("quality_benchmark.csv", index=False)
    print("Created quality_benchmark.csv with triggered issues.")

if __name__ == "__main__":
    create_quality_test_data()

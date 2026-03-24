import pandas as pd
import numpy as np

# Create a mock dataset with edge cases: 
# - missing values
# - sensitive columns
# - numeric and categorical imbalances
# - correlations

np.random.seed(42)
n_rows = 100

data = {
    "Age": np.random.randint(18, 65, size=n_rows),
    "Income": np.random.normal(50000, 15000, size=n_rows),
    "Gender": np.random.choice(["Male", "Female"], size=n_rows, p=[0.85, 0.15]), # Imbalanced sensitive
    "Location": ["New York"] * n_rows, # 100% Imbalanced sensitive
    "Department": np.random.choice(["Sales", "Engineering", "HR"], size=n_rows),
    "Score": np.random.uniform(0, 100, size=n_rows),
    "EmptyCol": [np.nan] * n_rows # All null column
}

df = pd.DataFrame(data)

# Inject >20% missing values into Income
df.loc[np.random.choice(df.index, size=25, replace=False), "Income"] = np.nan

# Create strong correlation between Age and Score purposely
df["Score"] = df["Age"] * 1.5 + np.random.normal(0, 5, size=n_rows)

df.to_csv("mock_data.csv", index=False)

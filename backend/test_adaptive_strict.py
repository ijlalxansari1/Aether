import sys; sys.path.insert(0, 'e:/Aether/backend')
import pandas as pd
from engine.aether_engine import AetherEngine

# df_clean (Numerical profile)
df_clean = pd.DataFrame({
    'score': [90,85,78,92,88], 
    'age': [25,30,28,32,27], 
    'salary': [50000,60000,55000,70000,58000]
})

# df_dirty (Categorical heavy, missing values, duplicates)
df_dirty = pd.DataFrame({
    'name':['Alice','Bob','Alice','Carol', 'Dave'], 
    'email':['a@t.com',None,'a@t.com','c@t.com', 'd@t.com'], 
    'cat':['A','A','A','B', 'C'],
    'val':[1, 2, 1, 3, 4] # Add some numeric to verify ratio
})

tests = [
    ('exploratory', df_clean), # Should skip cleaning/preproc
    ('ml', df_dirty),          # Should run all
    ('cleaning', df_dirty),    # Should run cleaning/preproc
    ('business', df_clean),    # Should skip cleaning/preproc
]

print("Intent         Profile               Cleaning  Preproc  Features")
print("-" * 65)
for intent, df in tests:
    r = AetherEngine(df, intent).run()
    ctx = r.get('context', {})
    
    # In the new logic, profile isn't returned, but we can check the Engine instance
    engine = AetherEngine(df, intent)
    profile = engine.profile
    
    cleaning = 'Yes' if 'cleaning' in ctx else 'No'
    prep = 'Yes' if 'preprocessing' in ctx else 'No'
    feat = 'Yes' if 'features' in ctx else 'No'
    
    print(f"{intent:<14} {profile:<20} {cleaning:>8}  {prep:>7}  {feat:>8}")

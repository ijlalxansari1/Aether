import sys; sys.path.insert(0, 'e:/Aether/backend')
import pandas as pd
from engine.aether_engine import AetherEngine

df_clean = pd.DataFrame({'score': [90,85,78,92,88], 'age': [25,30,28,32,27], 'salary': [50000,60000,55000,70000,58000]})
df_dirty = pd.DataFrame({'name':['Alice','Bob','Alice','Carol'], 'email':['a@t.com',None,'a@t.com','c@t.com'], 'cat':['A','A','A','B']})

tests = [
    ('exploratory', df_clean),
    ('ml', df_dirty),
    ('cleaning', df_clean),
    ('business', df_clean),
    ('reporting', df_dirty),
]

print("Intent         Profile               Cleaning  Preproc  Features")
print("-" * 65)
for intent, df in tests:
    r = AetherEngine(df, intent).run()
    profile = r.get('profile', '?')
    cleaning = 'Yes' if 'cleaning' in r else 'No'
    prep = 'Yes' if 'preprocessing' in r else 'No'
    feat = 'Yes' if 'features' in r else 'No'
    print(f"{intent:<14} {profile:<20} {cleaning:>8}  {prep:>7}  {feat:>8}")

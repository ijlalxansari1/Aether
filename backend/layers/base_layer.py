import pandas as pd

class BaseLayer:
    def __init__(self, df: pd.DataFrame):
        self.df = df
    
    def process(self, *args, **kwargs):
        raise NotImplementedError("Each layer must implement its own process logic.")

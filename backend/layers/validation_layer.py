import pandas as pd


class ValidationLayer:
    MIN_ROWS = 1
    MIN_COLS = 1
    MAX_NULL_RATIO = 0.95  # reject datasets that are >95% empty

    def __init__(self, df: pd.DataFrame):
        self.df = df

    def validate(self) -> dict:
        issues = []
        status = "valid"

        # 1. Empty dataset
        if self.df is None or self.df.empty:
            return {"status": "rejected", "issues": ["Dataset is empty or could not be parsed."]}

        # 2. Minimum shape
        rows, cols = self.df.shape
        if rows < self.MIN_ROWS:
            return {"status": "rejected", "issues": [f"Dataset has {rows} rows — too few to analyze."]}
        if cols < self.MIN_COLS:
            return {"status": "rejected", "issues": [f"Dataset has {cols} columns — too few to analyze."]}

        # 3. Null ratio check
        total_cells = rows * cols
        null_cells = int(self.df.isnull().sum().sum())
        null_ratio = null_cells / total_cells if total_cells > 0 else 0
        if null_ratio > self.MAX_NULL_RATIO:
            return {"status": "rejected", "issues": [f"Dataset is {null_ratio*100:.1f}% empty — too sparse to process."]}

        # 4. All-duplicate columns
        dup_cols = [c for c in self.df.columns if self.df.columns.tolist().count(c) > 1]
        if dup_cols:
            issues.append(f"Duplicate column names detected: {', '.join(set(dup_cols))}.")
            status = "warning"

        # 5. Single-value columns (zero variance)
        zero_var = [c for c in self.df.columns if self.df[c].nunique(dropna=False) <= 1]
        if zero_var:
            issues.append(f"Columns with no variation detected: {', '.join(zero_var[:3])}.")
            status = "warning"

        # 6. Low row count warning
        if rows < 10:
            issues.append(f"Dataset has only {rows} rows — results may be statistically unreliable.")
            status = "warning"

        return {"status": status, "issues": issues}

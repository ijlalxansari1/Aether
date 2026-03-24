class AetherAgent:
    """Strict context-driven agent as per user implementation."""

    def __init__(self, context: dict, intent: str = "exploratory", profile: str = "mixed"):
        self.context = context
        self.intent = intent
        self.profile = profile

    def answer(self, question: str) -> str:
        q = question.lower()

        if "feature" in q:
            return self.context.get("features", {})

        if "clean" in q:
            return self.context.get("cleaning", {})

        if "risk" in q:
            return self.context.get("ethical", {})

        if "quality" in q:
            return self.context.get("quality", {})

        return "Based on current analysis, refine your question."

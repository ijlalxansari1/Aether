class StoryLayer:
    def generate(self, eda, ethical, quality, feature, intent, profile) -> dict:
        """
        Synthesizes all layers into a unified data narrative based on user intent AND dataset profile.
        """
        rows = eda["summary"]["rows"]
        cols = eda["summary"]["columns"]
        
        # 1. Opening: The Data Context + Profile Awareness
        profile_descriptions = {
            "numerical": "numerical and structurally dense",
            "categorical_heavy": "categorical-heavy and structured around entities",
            "mixed": "a balanced mix of numerical and categorical attributes"
        }
        nature = profile_descriptions.get(profile, "structured")
        opening = f"This dataset appears to be {nature}. Given your {intent} intent, the system recommends "
        
        # 2. Adaptive Advice based on Profile-Intent intersection (Sync with Part 5/6)
        if profile == "categorical_heavy":
            if intent == "exploratory":
                advice = "focusing on distribution patterns and categorical node mapping."
            elif intent == "ml":
                advice = "prioritizing feature transformation and robust encoding strategies for entity-dense attributes."
            else:
                advice = "analyzing entity relationships and frequency distributions."
        elif profile == "numerical":
            advice = "deep statistical profiling and non-linear correlation scans."
        else:
            advice = "a multi-vector structural mapping approach."
        
        # 3. Security & Quality Synthesis
        has_pii = any("PII" in col.get("notes", "") for col in eda.get("columns", []))
        security_note = " Presence of PII fields requires careful handling and localized masking." if has_pii else ""
        
        health = "The overall data health is " + ("robust" if quality["quality_score"] > 80 else "conditionally stable") + "."
        risk = f"Aether has identified {ethical['risk_level']} risk markers.{security_note}"
        
        story_content = [
            f"{opening} {advice}",
            f"{health} {risk}",
            f"The system has calibrated its intelligence pipeline for {intent} processing on {profile} signals."
        ]
        
        return {
            "title": f"Aether Intelligence Story: {intent.capitalize()} ({profile.capitalize()})",
            "chapters": story_content,
            "system_verdict": "Proceed with caution" if ethical["risk_level"] == "High" or quality["quality_score"] < 50 else "System clearance granted"
        }

import os

class Settings:
    PROJECT_NAME: str = "Aether V1 MVP"
    MAX_UPLOAD_SIZE: int = 100 * 1024 * 1024  # 100 MB
    ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".json", ".pdf", ".docx"}
    ALLOWED_MIME_TYPES = {
        "text/csv",
        "text/plain",
        "application/json",
        "application/pdf",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }

settings = Settings()

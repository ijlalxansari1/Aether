FROM python:3.11-slim

WORKDIR /app

# Install system dependencies required by python-magic
RUN apt-get update && apt-get install -y libmagic1 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Switch from Windows python-magic-bin to Linux python-magic during build
RUN sed -i 's/python-magic-bin.*/python-magic/g' requirements.txt && pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

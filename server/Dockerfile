FROM python:3.11-slim

WORKDIR /app

# Change: Look for requirements.txt in the current directory
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

# Change: Copy everything from the current directory (.) to /app
COPY . .

EXPOSE 5000

CMD ["python", "app.py"]
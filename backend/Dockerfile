FROM python:3.12-slim
ENV PYTHONUNBUFFERED 1
WORKDIR /app
COPY . /app/
RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir -p /app/.secrets

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

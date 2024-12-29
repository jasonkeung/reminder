# Use the official Python image from Docker Hub
FROM python:3.12-slim

# Set environment variables
ENV PYTHONUNBUFFERED 1

# Set the working directory
WORKDIR /app

# Copy your project files into the container
COPY . /app/

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Ensure the secret path exists
RUN mkdir -p /app/.secrets

# Expose the port FastAPI runs on
EXPOSE 8000

# Run the FastAPI application using uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Use the official Python image
FROM python:3.12

# Set working directory inside the container
WORKDIR /app

# Copy the requirements file
COPY /TowerMap/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire Django project
COPY /TowerMap .

# Expose the port Django runs on
EXPOSE 8000

# Command to run the application
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

FROM python:3.14-slim

WORKDIR /app

ENV PYTHONPATH=/app

COPY requirements.txt .

RUN python -m pip install -r requirements.txt

COPY . /app

CMD ["python", "main.py"]
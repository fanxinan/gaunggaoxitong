FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PORT=8000 \
    WEEKLY_DATA_DIR=/data \
    WEEKLY_REQUIRE_AUTH=1 \
    WEEKLY_COOKIE_SECURE=true

WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    && groupadd --gid 10001 weekly \
    && useradd --uid 10001 --gid weekly --no-create-home weekly \
    && mkdir -p /data \
    && chown weekly:weekly /data

COPY --chown=weekly:weekly *.py ./
COPY --chown=weekly:weekly frontend/static/ ./frontend/static/

USER weekly
EXPOSE 8000
VOLUME ["/data"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import os,urllib.request; urllib.request.urlopen('http://127.0.0.1:'+os.environ.get('PORT','8000')+'/api/health',timeout=4).read()"

# One worker owns SQLite writes and in-process AI review tasks. The shell is
# replaced by uvicorn so a normal container stop reaches the application.
CMD ["sh", "-c", "exec uvicorn main:app --host 0.0.0.0 --port \"${PORT:-8000}\" --workers 1 --proxy-headers --forwarded-allow-ips \"${FORWARDED_ALLOW_IPS:-127.0.0.1}\""]

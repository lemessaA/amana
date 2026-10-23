import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))
os.environ.setdefault("DATABASE_URL", "postgresql+psycopg2://amana:@/amana?host=/home/lemessa-ahmed/.local/pgsock&port=5434")
os.environ.setdefault("SECRET_KEY", "test-secret")

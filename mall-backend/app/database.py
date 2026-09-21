import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# 数据库文件固定放在后端目录 mall-backend/mall.db，不随启动命令所在的当前目录变化。
# 如需使用其他数据库，可设置环境变量 MALL_DB_URL（完整的 SQLAlchemy URL）。
DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "mall.db"
DATABASE_URL = os.environ.get("MALL_DB_URL") or f"sqlite:///{DEFAULT_DB_PATH}"

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

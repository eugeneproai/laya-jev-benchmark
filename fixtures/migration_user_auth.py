# Database Migration: 20260929_user_auth_tables.py
from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class UserAccount(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True, autoincrement=True)
    uuid = Column(String(36), unique=True, nullable=False, index=True)
    username = Column(String(64), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Added OAuth token storage
    oauth_provider = Column(String(32), nullable=True)
    oauth_id = Column(String(128), nullable=True)

    __table_args__ = (
        Index('idx_user_oauth', 'oauth_provider', 'oauth_id'),
    )

def upgrade():
    # Safe additive migration: adds columns, does NOT drop any tables or delete data
    pass

def downgrade():
    pass

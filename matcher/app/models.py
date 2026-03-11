import enum
import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import Enum as SAEnum
from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base


class DreamTheme(str, enum.Enum):
    HAPPY = "HAPPY"
    SAD = "SAD"
    NIGHTMARE = "NIGHTMARE"
    LOVE = "LOVE"
    LUCID = "LUCID"
    ANGRY = "ANGRY"
    EXCITED = "EXCITED"
    CURIOUS = "CURIOUS"


class DreamVisibility(str, enum.Enum):
    PUBLIC = "PUBLIC"
    FOLLOWERS_ONLY = "FOLLOWERS_ONLY"
    PRIVATE = "PRIVATE"


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    nickname: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)


class Dream(Base):
    __tablename__ = "dreams"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    theme: Mapped[DreamTheme] = mapped_column(
        SAEnum(
            DreamTheme,
            native_enum=False,
            create_constraint=True,
            validate_strings=True,
            name="dream_theme",
        ),
        nullable=False,
    )
    visibility: Mapped[DreamVisibility] = mapped_column(
        SAEnum(
            DreamVisibility,
            native_enum=False,
            create_constraint=True,
            validate_strings=True,
            name="dream_visibility",
        ),
        nullable=False,
    )
    embedding: Mapped[list[float] | None] = mapped_column(Vector(384), nullable=True)
    like_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    comment_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic_settings import BaseSettings, SettingsConfigDict
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    DATABASE_URL: str


settings = Settings()


class Base(DeclarativeBase):
    pass


def _build_async_engine():
    url = settings.DATABASE_URL
    connect_args = {}

    if "+asyncpg" in url:
        parts = urlsplit(url)
        query = parse_qsl(parts.query, keep_blank_values=True)

        kept = []
        for key, value in query:
            if key == "sslmode":
                if value == "disable":
                    connect_args["ssl"] = False
                elif value in {"require", "verify-ca", "verify-full"}:
                    connect_args["ssl"] = True
                continue
            kept.append((key, value))

        connect_args["server_settings"] = {"client_encoding": "utf8"}

        normalized_url = urlunsplit((parts.scheme, parts.netloc, parts.path, urlencode(kept), parts.fragment))
        return create_async_engine(normalized_url, future=True, echo=False, connect_args=connect_args)

    return create_async_engine(url, future=True, echo=False)


async_engine = _build_async_engine()

AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

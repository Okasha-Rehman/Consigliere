from pydantic_settings import BaseSettings
import os


class Settings(BaseSettings):
    # Environment: dev, staging, prod
    env: str

    # Database - REQUIRED
    database_url: str

    # JWT - REQUIRED
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 10080  # 7 days

    # Application
    upload_dir: str = "/app/uploads"
    max_upload_size: int = 5 * 1024 * 1024  # 5MB

    # CORS origins
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    # Quote API
    quote_api_url: str = "https://api.quotable.io/quotes/random?tags=wisdom"

    # Logging level - will be set based on env in __init__
    log_level: str = "INFO"

    class Config:
        env_file = ".env.dev"
        case_sensitive = False

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Set log level based on environment
        if self.env == "dev":
            self.log_level = "DEBUG"
        elif self.env == "staging":
            self.log_level = "INFO"
        elif self.env == "prod":
            self.log_level = "WARNING"
        else:
            self.log_level = "INFO"  # default


settings = Settings()

import logging
import sys
import os
from app.core.config import settings

# Create logs directory if it doesn't exist
if not os.path.exists("logs"):
    os.makedirs("logs")

def get_logger(name: str):
    logger = logging.getLogger(name)
    
    if not logger.handlers:
        # Console handler
        console_handler = logging.StreamHandler(sys.stdout)
        console_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        console_handler.setFormatter(console_formatter)
        logger.addHandler(console_handler)
        
        # File handler
        file_handler = logging.FileHandler("logs/app.log")
        file_formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        file_handler.setFormatter(file_formatter)
        logger.addHandler(file_handler)
        
    logger.setLevel(logging.DEBUG if settings.DEBUG else logging.INFO)
    return logger

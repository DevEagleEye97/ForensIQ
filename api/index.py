"""
Vercel Serverless Function Entrypoint for ForensIQ FastAPI Backend
"""
import sys
import os

# Add root directory to sys.path so modules resolve correctly
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app

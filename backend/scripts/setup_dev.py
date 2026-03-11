"""
scripts/setup_dev.py
────────────────────
Initialize the development environment: 
1. Create necessary folders
2. Check dependencies
3. (Optional) Run initial migrations
"""
import os
import sys

def setup():
    print("🚀 Setting up development environment...")
    
    # Check if we're in the right directory
    if not os.path.exists("app"):
        print("❌ Error: Run this script from the backend/ directory.")
        return

    # Ensure logs exist
    if not os.path.exists("logs"):
        os.makedirs("logs")
        print("📁 Created logs/")

    print("✅ Basic setup complete.")

if __name__ == "__main__":
    setup()

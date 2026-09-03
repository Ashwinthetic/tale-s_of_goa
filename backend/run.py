"""
HH GOA - Python FastAPI Backend Entry Point
Run with: python run.py
"""
import uvicorn

if __name__ == "__main__":
    print("\n=======================================================")
    print("  HH GOA - Face ID & Verification Python Backend")
    print("  FastAPI Server starting on http://localhost:8000")
    print("  Interactive Swagger Docs: http://localhost:8000/docs")
    print("=======================================================\n")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

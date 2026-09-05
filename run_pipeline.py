"""
Root runner for HH GOA Task 3 Pipeline
Delegates to backend/run_pipeline.py
"""
import os
import sys
import subprocess

current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, "backend")

# Try to use backend virtual environment python if available
venv_python = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
python_exec = venv_python if os.path.exists(venv_python) else sys.executable

backend_script = os.path.join(backend_dir, "run_pipeline.py")
args = [python_exec, backend_script] + sys.argv[1:]

sys.exit(subprocess.call(args, cwd=backend_dir))

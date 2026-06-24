# backend/runner.py
import subprocess
import sys
import tempfile
import os
import shutil


def find_node_executable() -> str | None:
    node_exec = shutil.which("node")
    if node_exec:
        return node_exec

    if sys.platform == "win32":
        possible_paths = [
            r"C:\Program Files\nodejs\node.exe",
            r"C:\Program Files (x86)\nodejs\node.exe",
        ]
        for path in possible_paths:
            if os.path.exists(path):
                return path

    return None


def execute_code(code: str, language: str) -> str:
    """
    Executes raw string code inside a secure, isolated temporary file architecture
    and captures standard stdout/stderr streams with an execution timeout.
    """
    if language not in ["python", "javascript"]:
        return f"Error: Execution runtime for '{language}' is not supported."

    # Create a temporary file that cleans itself up after execution
    suffix = ".py" if language == "python" else ".js"
    with tempfile.NamedTemporaryFile(mode='w', suffix=suffix, delete=False) as temp_file:
        temp_file.write(code)
        temp_file_path = temp_file.name

    try:
        # Determine the runtime executor command based on the target language
        if language == "python":
            cmd = [sys.executable, temp_file_path]
        else:
            node_exec = find_node_executable()
            if not node_exec:
                return (
                    "Execution Error: 'node' runtime environment not found on the server host machine. "
                    "Ensure Node.js is installed and available on PATH, or install it from https://nodejs.org/."
                )
            cmd = [node_exec, temp_file_path]

        # Execute the process with a strict 5-second maximum timeout limit
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=5.0
        )
        
        # Combine standard output or system error logs based on return conditions
        if result.returncode == 0:
            return result.stdout if result.stdout else "--- Code executed successfully with no console output ---"
        else:
            return result.stderr

    except subprocess.TimeoutExpired:
        return "Execution Error: process terminated due to a Timeout Limit (5 seconds exceeded). Check for infinite loops!"
    except FileNotFoundError:
        if language == "javascript":
            return "Execution Error: 'node' runtime environment not found on the server host machine."
        return "Execution Error: code execution subsystem failure."
    finally:
        # Ensure the temporary file is completely erased from Mac storage
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

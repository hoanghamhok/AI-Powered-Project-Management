import subprocess
import os

def run_step(cmd):
    print(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print(f"Error: {result.stderr}")
    return result.returncode

if __name__ == "__main__":
    os.chdir(r"c:\Users\dkfbr\todolist\be\ml")
    if run_step("python extract_features.py") == 0:
        run_step("python train_model.py")

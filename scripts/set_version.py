import os
import sys
import json
from pathlib import Path

manifest_file = Path(sys.argv.pop())
print("Setting version in file: " + str(manifest_file))

version = os.environ["TRAVIS_TAG"].strip("v")

with manifest_file.open("r") as f:
    data = json.load(f)
    data["version"] = version

with manifest_file.open("w") as f:
    json.dump(data, f, indent=2)

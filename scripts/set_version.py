import os
import sys
import json
from pathlib import Path

manifest_file = Path(sys.argv.pop())
print(manifest_file.absolute())

version = os.environ["TRAVIS_TAG"].strip("v")

with open(manifest_file, "r") as f:
    data = json.load(f)
    data["version"] = version

with open(manifest_file, "w") as f:
    json.dump(data, f)

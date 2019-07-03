#!/usr/bin/env python3

import os
import sys
import json
from pathlib import Path

manifest_file = Path(sys.argv.pop())

if 'TRAVIS_TAG' not in os.environ:
    print("WARNING: Environment variable TRAVIS_TAG not set, version was not set.")
    exit(1)

version = os.environ["TRAVIS_TAG"].strip("v")

with manifest_file.open("r") as f:
    data = json.load(f)
    data["version"] = version

with manifest_file.open("w") as f:
    json.dump(data, f, indent=2)

print("Version v{version} set successfully in: {file}".format(version=version, file=manifest_file))

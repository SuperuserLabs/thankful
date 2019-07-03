# Release guide

How to make a release:

- Make sure tests pass and do some basic usage testing.
- Create and checkout a branch for the new version named: dev/vX.Y.Z
- Run `env TRAVIS_TAG=<version> make prepublish` and make sure it succeeds.
- Commit the changed files (`package.json` and `dist/manifest.json`).
- Create a PR, merge when checks have passed.
- Create a release/tag on GitHub.
  - This will automatically deploy it to Mozilla Addons
- Check out the master branch.
- Publish to Chrome webstore (not automated)
  - First time only:
    - Create a `.env-webstore` with your `CLIENT_ID=...` and `CLIENT_SECRET=...` on separate lines
    - Run `make webstore-step1`, authenticate and put the received value as `CODE=...` in `.env-webstore`
    - Run `make webstore-step2`, put value of the printed `refresh_token` key into `REFRESH_TOKEN=...`
  - Run `make publish-webstore`
- Upload the source zip from the GitHub tag to Mozilla Addons.

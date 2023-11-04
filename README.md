Superuser Labs website
======================

[![Build](https://github.com/SuperuserLabs/superuserlabs.github.io/actions/workflows/pages.yml/badge.svg)](https://github.com/SuperuserLabs/superuserlabs.github.io/actions/workflows/pages.yml)

The website for Superuser Labs and our projects.

## How to develop

When developing, all files will end up in `build-dev/`

 - Run `make install` to install the npm packages needed.
 - Build everything:
     - Run `make build-dev`
 - If you want to automatically rebuild files when editing them:
     - Run `make dev-pug-{superuser,thankful}`, depending on which pug-files you will be editing.
     - Run `make dev-scss`, if you will be editing.
 - Run `make serve` to start a web server to host from.
 - Open [0.0.0.0:8123](0.0.0.0:8123) in your browser.


## How the CI works

 - It builds two targets, `build` and `build-thankful` into two respective directories with the same names. 
 - It pushes the `build-thankful` build to the `gh-pages` branch on the `SuperuserLabs/thankful` repo.
 - It pushes `build` to the `master` branch on this repo (`SuperuserLabs/superuserlabs.github.io`).

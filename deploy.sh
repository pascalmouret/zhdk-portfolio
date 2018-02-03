#!/usr/bin/env bash
./build.sh
echo "DEPLOYING"
rsync -av --delete ./target/ root@mouret.io:/var/www/portfolio
echo "DONE"

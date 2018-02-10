#!/usr/bin/env bash
rm -rf target
./build.sh
echo "DEPLOYING"
rsync -av --delete ./target/ root@mouret.io:/var/www/portfolio
echo "DONE"

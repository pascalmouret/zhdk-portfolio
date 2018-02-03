#!/usr/bin/env bash
rsync -av --delete ./target/ root@mouret.io:/var/www/portfolio

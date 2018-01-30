#!/usr/bin/env bash
fswatch -o src style art index.html | while read num ; \
  do ./build.sh
  done

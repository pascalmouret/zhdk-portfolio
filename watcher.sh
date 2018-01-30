#!/usr/bin/env bash
fswatch -o src style art pages index.html | while read num ; \
  do ./build.sh
  done

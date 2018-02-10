#!/usr/bin/env bash
echo "BUILDING PROJECT"
mkdir -p target
mkdir -p target/art
mkdir -p target/art/char
lessc --strict-imports style/style.less target/style.css
cat src/lib/*.js > target/lib.js
cat src/gameloop.js src/game.js > target/main.js
cp art/misc/*.png target/art/
cp art/char/*.png target/art/
cp -r pages/ target/pages
cp -r fonts/ target/fonts
cp -r favicons/ target/favicons
cp index.html target/index.html

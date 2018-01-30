#!/usr/bin/env bash
echo "BUILDING PROJECT"
mkdir -p target
mkdir -p target/art
lessc style/style.less target/style.css
cat src/lib/*.js > target/lib.js
cat src/gameloop.js src/game.js > target/main.js
cp art/misc/floor.png target/art/floor.png
cp art/misc/box.png target/art/box.png
cp -r pages/ target/pages
cp index.html target/index.html

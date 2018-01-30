#!/usr/bin/env bash
lessc style/style.less style/style.css
cat src/gameloop.js src/game.js > src/main.js

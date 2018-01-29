(function ($, _, window, document) {
    'use strict';

    // game loop based on http://isaacsukin.com/news/2015/01/detailed-explanation-javascript-game-loops-and-timing
    function Game(render, simulate, maxFPS, catchUp) {
        maxFPS = maxFPS || 60;
        catchUp = catchUp || _.noop();

        var lastTimestamp = 0,
            accDelta = 0,
            fixedDelta = 1000 / maxFPS;

        requestAnimationFrame(function (timestamp) {
            lastTimestamp = timestamp;
        });

        function loop(timestamp) {
            // make sure the simulation runs in fixed time, independent of frame rate
            accDelta += timestamp - lastTimestamp;
            while (accDelta >= fixedDelta) {
                simulate(accDelta);
                accDelta -= fixedDelta;
                // panic if the simulation falls too far behind
                if (accDelta / fixedDelta >= 200) {
                    catchUp();
                    accDelta = 0;
                }
            }

            // call render with delta from last render
            render(timestamp - lastTimestamp);

            // request new frame
            lastTimestamp = timestamp;
            requestAnimationFrame(loop);
        }

        requestAnimationFrame(loop)
    }

    var UP = 87,
        LEFT = 65,
        RIGHT = 68,
        JUMP = 32,
        FUNCTION_KEYS = [UP, LEFT, RIGHT, JUMP],
        VIEWPORT = { x: $('body').width(), y: $('body').height()};

    var FLOOR = $('#floor').height(),
        ACCELERATION = 0.05,
        FALL_ACCELERATION = 0.02,
        MAX_X = 1,
        MAX_Y = 5;

    var player = $('#player'),
        velocity = { x: 0, y: 0 },
        playerPos = { x: FLOOR, y: FLOOR },
        falling = false;

    var pressedKeys = [];

    function init() {
        $(document).ready(function () {
            $(document).on('keydown', function (e) {
                if (!_.some(pressedKeys, function (k) { return k === e.which }) && _.some(FUNCTION_KEYS, function (k) { return k === e.which })) {
                    pressedKeys.push(e.which);
                    e.preventDefault();
                }
            });

            $(document).on('keyup', function (e) {
                _.remove(pressedKeys, function(k) { return k === e.which });
            });

            Game(render, simulate);
        });
    }

    function simulate(delta) {
        handleInput(delta);
    }

    function render() {
        player.css({
            left: '' + (playerPos.x) + 'px',
            bottom: '' + (playerPos.y) + 'px'
        });
    }
    
    function handleInput(delta) {
        var movingX = false,
            jumping = false;

        _.forEach(pressedKeys, function (key) {
            switch (key) {
                case RIGHT:
                    velocity.x = Math.min(velocity.x + ACCELERATION * delta, MAX_X);
                    movingX = true;
                    break;
                case LEFT:
                    velocity.x = Math.max(velocity.x - ACCELERATION * delta, -MAX_X);
                    movingX = true;
                    break;
                case UP:
                case JUMP:
                    if (!falling && velocity.y < MAX_Y) {
                        velocity.y = Math.min(velocity.y + ACCELERATION * delta, MAX_Y);
                        jumping = true;
                    } else {
                        falling = true;
                        _.remove(pressedKeys, function (k) { return k === UP || k === JUMP });
                    }
                    break;
                default:
                    _.remove(pressedKeys, function(k) { return k === key })
            }
        });

        if (pressedKeys.length || falling) {
            if (!movingX) {
                velocity.x = 0;
            }

            if (velocity.y > 0 && !jumping) {
                falling = true;
            }

            if (falling) {
                velocity.y = Math.max(velocity.y - FALL_ACCELERATION * delta, -MAX_Y);
            }
        }
        
        move(delta);
    }
    
    function move(delta) {
        playerPos.x = clampBetween(playerPos.x + velocity.x * delta, 0, VIEWPORT.x);
        playerPos.y = clampBetween(playerPos.y + velocity.y * delta, FLOOR, VIEWPORT.y);
        if (playerPos.y <= FLOOR) {
            velocity.y = FLOOR;
            falling = false;
        }
    }

    function clampBetween(num, min, max) {
        return Math.min(Math.max(num, min), max);
    }

    init();

})($, _, window, document);

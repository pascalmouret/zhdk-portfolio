(function (window, _) {
    "use strict";

    window.GameLoop = function GameLoop(render, simulate, maxFPS, catchUp) {
        maxFPS = maxFPS || 60;
        catchUp = catchUp || _.noop;

        var lastTimestamp = 0,
            accDelta = 0,
            fixedDelta = 1000 / maxFPS;

        // initialise timestamp
        window.requestAnimationFrame(function (timestamp) {
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
            window.requestAnimationFrame(loop);
        }

        window.requestAnimationFrame(loop)
    }

})(window, _);
(function (document, window, $, _, GameLoop) {
    "use strict";

    // KEYS
    var UP = 87,
        UP_ARROW = 38,
        LEFT = 65,
        LEFT_ARROW = 37,
        RIGHT = 68,
        RIGHT_ARROW = 39,
        SPACE = 32,
        FUNCTION_KEYS = [UP, UP_ARROW, LEFT, LEFT_ARROW, RIGHT, RIGHT_ARROW, SPACE];

    // DIMENSIONS
    var FLOOR = null,
        BOX_HEIGHT = 100,
        VIEWPORT = { x: 0, y: 0};

    // PHYSICS
    var X_ACCELERATION = 0.05,
        Y_ACCELERATION = 0.005,
        MAX_X = 0.5,
        MAX_Y = 0.8;

    // OBJECTS
    var $game = null,
        $player = null,
        $debug = null;

    // PLAYER DATA
    var player = {
        velocity: { x: 0, y: 0 },
        pos: { x: 0, y: 0 },
        falling: false
    };

    // MISC
    var debugLog = [],
        pressedKeys = [],
        boxUrls = [];

    function init(element, boxes) {
        boxUrls = boxes;
        initState(element);
        initKeyLogger();
        startGameLoop();
        spawnBoxes();
    }

    function initState(element) {
        $game = $(element);
        $player = $game.find('#player');
        $debug = $game.find('#debug');

        FLOOR = $game.find('#floor').height() / 2;
        VIEWPORT.x = $game.width();
        VIEWPORT.y = $game.height();

        player.pos.y = FLOOR;
        player.pos.x = FLOOR;
    }

    function initKeyLogger() {
        $(document).on('keydown', function (e) {
            if (!_.some(pressedKeys, function (k) { return k === e.which }) && _.some(FUNCTION_KEYS, function (k) { return k === e.which })) {
                pressedKeys.push(e.which);
                e.preventDefault();
            }
        });

        $(document).on('keyup', function (e) {
            _.remove(pressedKeys, function(k) { return k === e.which });
        });
    }

    function spawnBoxes() {
        var padding = VIEWPORT.x / (boxUrls.length + 1);

        _.forEach(boxUrls, function (url, i) {
            var box = $('<div class="box" data-url="' + url +'"></div>');
            box.css({
                bottom: '' + (FLOOR + BOX_HEIGHT) + 'px',
                left: '' + (i + 1) * padding + 'px'
            });
            $game.prepend(box);
        })
    }

    function startGameLoop() {
        GameLoop(render, simulate, 60);
    }

    function simulate(delta) {
        handleInput(delta);
    }

    function render() {
        $player.css({
            left: '' + (player.pos.x) + 'px',
            bottom: '' + (player.pos.y) + 'px'
        });
        renderDebug();
    }

    function renderDebug() {
        $debug.html(_.join(debugLog, '<br/>'));
        debugLog = [];
    }

    function renderLog(string) {
        debugLog.push(string);
    }

    function handleInput(delta) {
        var movingX = false,
            jumping = false;

        _.forEach(pressedKeys, function (key) {
            switch (key) {
                case RIGHT_ARROW:
                case RIGHT:
                    player.velocity.x = Math.min(player.velocity.x + X_ACCELERATION * delta, MAX_X);
                    movingX = true;
                    break;
                case LEFT_ARROW:
                case LEFT:
                    player.velocity.x = Math.max(player.velocity.x - X_ACCELERATION * delta, -MAX_X);
                    movingX = true;
                    break;
                case UP_ARROW:
                case UP:
                case SPACE:
                    if (!player.falling && player.velocity.y < MAX_Y) {
                        player.velocity.y = Math.min(player.velocity.y + Y_ACCELERATION * delta, MAX_Y);
                        jumping = true;
                    } else {
                        player.falling = true;
                        _.remove(pressedKeys, function (k) { return k === UP || k === SPACE || k === UP_ARROW });
                    }
                    break;
                default:
                    // should not be required, but for sanity reasons remove any unused keys
                    _.remove(pressedKeys, function(k) { return k === key })
            }
        });

        if (!movingX) {
            player.velocity.x = 0;
        }

        if (player.velocity.y > 0 && !jumping) {
            player.falling = true;
        }

        if (player.falling) {
            player.velocity.y = Math.max(player.velocity.y - Y_ACCELERATION * delta, -MAX_Y);
        }

        move(delta);
    }

    function move(delta) {
        player.pos.x = clampBetween(player.pos.x + player.velocity.x * delta, 0, VIEWPORT.x);
        player.pos.y = clampBetween(player.pos.y + player.velocity.y * delta, FLOOR, VIEWPORT.y);
        if (player.pos.y <= FLOOR) {
            player.velocity.y = 0;
            player.falling = false;
        }
    }

    function clampBetween(num, min, max) {
        return Math.min(Math.max(num, min), max);
    }

    window.Game = init;

})(document, window, $, _, GameLoop);

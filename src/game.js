(function (document, window, $, _, GameLoop) {
    "use strict";

    // KEYS
    var UP = 87,
        LEFT = 65,
        RIGHT = 68,
        JUMP = 32,
        FUNCTION_KEYS = [UP, LEFT, RIGHT, JUMP];

    // DIMENSIONS
    var FLOOR = null,
        VIEWPORT = { x: 0, y: 0};

    // PHYSICS
    var ACCELERATION = 0.05,
        FALL_ACCELERATION = 0.02,
        MAX_X = 1,
        MAX_Y = 5;

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
        pressedKeys = [];

    function init(element) {
        initState(element);
        initKeyLogger();
        startGameLoop();
    }

    function initState(element) {
        $game = $(element);
        $player = $game.find('#player');
        $debug = $game.find('#debug');

        FLOOR = $game.find('#floor').height();
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

    function startGameLoop() {
        GameLoop(render, simulate, 60);
    }

    function simulate(delta) {
        handleInput(delta);
    }

    function render() {
        renderLog('x: ' + player.pos.x.toFixed(2) + ' / y: ' + player.pos.y.toFixed(2));
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
                case RIGHT:
                    player.velocity.x = Math.min(player.velocity.x + ACCELERATION * delta, MAX_X);
                    movingX = true;
                    break;
                case LEFT:
                    player.velocity.x = Math.max(player.velocity.x - ACCELERATION * delta, -MAX_X);
                    movingX = true;
                    break;
                case UP:
                case JUMP:
                    if (!player.falling && player.velocity.y < MAX_Y) {
                        player.velocity.y = Math.min(player.velocity.y + ACCELERATION * delta, MAX_Y);
                        jumping = true;
                    } else {
                        player.falling = true;
                        _.remove(pressedKeys, function (k) { return k === UP || k === JUMP });
                    }
                    break;
                default:
                    _.remove(pressedKeys, function(k) { return k === key })
            }
        });

        if (pressedKeys.length || player.falling) {
            if (!movingX) {
                player.velocity.x = 0;
            }

            if (player.velocity.y > 0 && !jumping) {
                player.falling = true;
            }

            if (player.falling) {
                player.velocity.y = Math.max(player.velocity.y - FALL_ACCELERATION * delta, -MAX_Y);
            }
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

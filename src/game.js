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
        BOX_HEIGHT = 120,
        VIEWPORT = { x: 0, y: 0};

    // PHYSICS
    var X_ACCELERATION = 0.05,
        Y_ACCELERATION = 0.0017,
        MAX_X = 0.15,
        MAX_Y = 0.2;

    // OBJECTS
    var $game = null,
        $player = null,
        $debug = null,
        $overlay = null;

    // PLAYER DATA
    var player = {
        velocity: { x: 0, y: 0 },
        pos: { x: 0, y: 0 },
        jumping: false,
        falling: false,
        facingRight: true,
        animation: ''
    };

    // MISC
    var pressedKeys = [],
        boxes = [],
        rect_cache = [];

    function init(element, boxes) {
        initState(element);
        initKeyLogger();
        startGameLoop();
        spawnBoxes(boxes);

        window.onload = function () {
            startGameLoop();
            $('#loader-overlay').hide();
        };

        window.onunload = function () {}; // disable "load" caching
    }

    function initState(element) {
        $game = $(element);
        $player = $game.find('#player');
        $debug = $game.find('#debug');
        $overlay = $game.find('#overlay');

        FLOOR = $game.find('#floor').height() / 2;
        VIEWPORT.x = $game.width();
        VIEWPORT.y = $game.height();

        player.pos.y = FLOOR;
        player.pos.x = FLOOR;
        player.animation = getAnimationClass();
    }

    function initKeyLogger() {
        $(document).on('keydown', function (e) {
            if (!e.originalEvent.repeat && !_.some(pressedKeys, function (k) { return k === e.which }) && _.some(FUNCTION_KEYS, function (k) { return k === e.which })) {
                pressedKeys.push(e.which);
                e.preventDefault();
            }
        });

        $(document).on('keyup', function (e) {
            _.remove(pressedKeys, function(k) { return k === e.which });
        });
    }

    function spawnBoxes(boxUrls) {
        var padding = VIEWPORT.x / (boxUrls.length + 1);

        _.forEach(boxUrls, function (url, i) {
            var box = $('<div class="box" data-url="' + url +'"></div>'),
                iframe = $('<iframe src="' + url + '" class="inactive"></iframe>'),
                pointer = $('<div class="pointer" data-url="' + url + '"></div>');
            $overlay.append(iframe);
            box.css({
                bottom: '' + (FLOOR + BOX_HEIGHT) + 'px',
                left: '' + (i + 1) * padding + 'px'
            });
            $game.prepend(box);
            pointer.css({
                bottom: '' + (FLOOR + BOX_HEIGHT + box.height() + 2) + 'px',
                left: '' + ((i + 1) * padding + box.width() / 2 - 10) + 'px'
            });
            $game.append(pointer);
            boxes.push(box);

            rect_cache[i] = buildCollisionRect(box);
        });
    }

    function startGameLoop() {
        GameLoop(render, simulate, 30);
    }

    function simulate(delta) {
        handleInput(delta);
        checkBoxCollisions();
        player.animation = getAnimationClass();
    }

    function render() {
        $player.css({
            left: '' + (player.pos.x) + 'px',
            bottom: '' + (player.pos.y) + 'px'
        });
        if ($player.attr('class') !== player.animation) {
            $player.attr('class', player.animation);
        }
    }

    function getAnimationClass() {
        function facingClass() {
            if (player.facingRight) {
                return 'right';
            } else {
                return 'left';
            }
        }

        function animationClass() {
            if (player.velocity.y > 0) {
                return 'jumping';
            } else if (player.velocity.y < 0) {
                return 'falling';
            } else if (player.velocity.x !== 0) {
                return 'walking';
            } else {
                return 'idle';
            }
        }

        return animationClass() + ' ' + facingClass();
    }

    function handleInput(delta) {
        var acceleratedX = false,
            jumped = false;

        _.forEach(pressedKeys, function (key) {
            switch (key) {
                case RIGHT_ARROW:
                case RIGHT:
                    player.velocity.x = Math.min(player.velocity.x + X_ACCELERATION * delta, MAX_X);
                    player.facingRight = true;
                    acceleratedX = true;
                    break;
                case LEFT_ARROW:
                case LEFT:
                    player.velocity.x = Math.max(player.velocity.x - X_ACCELERATION * delta, -MAX_X);
                    player.facingRight = false;
                    acceleratedX = true;
                    break;
                case UP_ARROW:
                case UP:
                case SPACE:
                    if (!player.falling && player.velocity.y < MAX_Y) {
                        player.velocity.y = Math.min(player.velocity.y + Y_ACCELERATION * delta, MAX_Y);
                        player.jumping = true;
                        jumped = true;
                    } else {
                        player.falling = true;
                        player.jumping = false;
                        _.remove(pressedKeys, function (k) { return k === UP || k === SPACE || k === UP_ARROW });
                    }
                    break;
                default:
                    // should not be required, but for sanity reasons remove any unused keys
                    _.remove(pressedKeys, function(k) { return k === key })
            }
        });

        if (!acceleratedX) {
            player.velocity.x = 0;
        }

        if (player.velocity.y > 0 && !jumped) {
            player.falling = true;
            player.jumping = false;
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

    function buildCollisionRect(element) {
        return {
            x: element.offset().left,
            y: element.offset().top,
            height: element.outerHeight(),
            width: element.outerWidth()
        }
    }

    function checkBoxCollisions() {
        function isColliding(a, b) {
            return !(
                ((a.y + a.height) < (b.y)) ||
                (a.y > (b.y + b.height)) ||
                ((a.x + a.width) < b.x) ||
                (a.x > (b.x + b.width))
            );
        }

        if (player.velocity.y !== 0) {
            var playerRect = buildCollisionRect($player);
            _.forEach(boxes, function (box, index) {
                if (isColliding(playerRect, rect_cache[index])) {
                    onBoxCollision(box);
                }
            });
        }
    }

    function onBoxCollision(box) {
        if (box.attr('data-active') !== 'true') {
            var url = box.attr('data-url');
            $game.find('.box[data-active="true"]').attr('data-active', 'false').css({'margin-bottom': '0'});
            box.attr('data-active', 'true');
            box.css({'margin-bottom': '-=20px'});
            box.animate({
                'margin-bottom': '+=20px'
            }, 1000, 'easeOutElastic');
            $game.find('.pointer.active').removeClass('active');
            $game.find('.pointer[data-url="' + url + '"]').addClass('active');
            $overlay.find('.active').attr('class', '');
            $overlay.find('[src="' + url + '"]').addClass('active');
            if (player.velocity.y > 0) {
                player.velocity.y = 0;
            }
        }
    }

    window.Game = init;

})(document, window, $, _, GameLoop);

(function ($, _, window, document) {
    "use strict";

    var UP = 87,
        LEFT = 65,
        RIGHT = 68,
        JUMP = 32,
        FUNCTION_KEYS = [UP, LEFT, RIGHT, JUMP];

    var FLOOR = $("#floor").height(),
        LOOP = 50,
        ACCELERATION = 0.5,
        FALL_ACCELERATION = 0.2,
        MAX_X = 10,
        MAX_Y = 50;

    var player = $("#player"),
        velocity = { x: 0, y: 0 },
        falling = false,
        top_offset = player.offset().top;

    var pressed = [];

    $(document).ready(function () {
        $(document).on("keydown", function (e) {
            if (!_.some(pressed, function (k) { return k === e.which }) && _.some(FUNCTION_KEYS, function (k) { return k === e.which })) {
                pressed.push(e.which);
                e.preventDefault();
            }
        });

        $(document).on("keyup", function (e) {
            _.remove(pressed, function(k) { return k === e.which });
        });

        // main game loop
        selfAdjustingInterval(function (delta) {
            var moving_x = false,
                jumping = false;

            _.forEach(pressed, function (key) {
                switch (key) {
                    case RIGHT:
                        velocity.x = Math.min(velocity.x + ACCELERATION * delta, MAX_X);
                        moving_x = true;
                        break;
                    case LEFT:
                        velocity.x = Math.max(velocity.x - ACCELERATION * delta, -MAX_X);
                        moving_x = true;
                        break;
                    case UP:
                    case JUMP:
                        if (!falling && velocity.y < MAX_Y) {
                            velocity.y = Math.min(velocity.y + ACCELERATION * delta, MAX_Y);
                            jumping = true;
                        } else {
                            falling = true;
                            _.remove(pressed, function (k) { return k === UP || k === JUMP });
                        }
                        break;
                    default:
                        _.remove(pressed, function(k) { return k === key })
                }
            });

            if (pressed.length || falling) {
                if (!moving_x) {
                    velocity.x = 0;
                }

                if (velocity.y > 0 && !jumping) {
                    falling = true;
                }

                if (falling) {
                    if (player.offset().top - velocity.y > top_offset) {
                        player.css({'bottom': "" + FLOOR + "px"});
                        velocity.y = 0;
                        falling = false;
                    } else {
                        velocity.y = Math.max(velocity.y - FALL_ACCELERATION * delta, -MAX_Y);
                    }
                }

                move(velocity.x, velocity.y);
            }
        }, LOOP);
    });

    function move(x, y) {
        player.animate({
            'left': "+=" + x + "px",
            'bottom': "+=" + y + "px"
        }, LOOP, "linear")
    }

    // https://www.sitepoint.com/creating-accurate-timers-in-javascript/
    function selfAdjustingInterval(callback, interval) {
        var start = new Date().getTime(),
            time = 0;

        function go() {
            time += interval;

            var diff = (new Date().getTime() - start) - time;

            callback(interval + diff);

            window.setTimeout(go, (interval - diff));
        }

        window.setTimeout(go, interval)
    }

})($, _, window, document);

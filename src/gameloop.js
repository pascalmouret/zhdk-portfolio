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

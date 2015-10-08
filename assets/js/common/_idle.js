angular.module("common").
    factory("_idle", function ($rootScope, _modernizr) {
        var idleDelay = 5000;
        var minDistance = 15;

        var idleTimer = null;
        var startX = null;
        var startY = null;
        var onMove = _.throttle(_onMove, 50);

        function _onMove(e) {
            if (!startX || _getDistance(startX, startY, e.pageX, e.pageY) > minDistance) {
                startX = e.pageX;
                startY = e.pageY;

                $rootScope.$emit("_idle:active");

                _clearTimer();
                _setTimer();
            }
        }

        function _onClick() {
            _clearTimer();
            _setTimer();
        }

        function _setTimer() {
            idleTimer = setInterval(_onIdle, idleDelay);
        }

        function _clearTimer() {
            if (idleTimer != null) {
                clearInterval(idleTimer);
                idleTimer = null;
            }
        }

        function _onIdle() {
            $rootScope.$emit("_idle:idle");
        }

        function _getDistance(x1, y1, x2, y2) {
            return Math.sqrt(Math.pow((x2 - x1), 2) + Math.pow((y2 - y1), 2));
        }

        function on() {
            if (!idleTimer && !_modernizr.touch) {
                _setTimer();
                $(document)
                    .on("mousemove", onMove)
                    .on("click", _onClick);
            }
        }

        function off() {
            if (idleTimer) {
                _clearTimer();
                $(document)
                    .off("mousemove", onMove)
                    .off("click", _onClick);
            }
        }

        return {
            on: on,
            off: off
        }
    });
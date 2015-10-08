angular.module("common")
    .factory("_window", function ($rootScope) {
        var throttleDelay = 200;

        function on(event, callback, doNotWrap) {
            var wrapped = (doNotWrap) ? callback : throttle(callback);

            $(window).on(event, wrapped);
        }

        function onAndOffOnDestroy(event, $scope, callback) {
            var wrapped = throttle(callback);

            on(event, wrapped, true);
            offOnDestroy(event, $scope, wrapped);
        }

        function throttle(callback, delay) {
            return _.throttle(function () {
                $rootScope.$safeApply(callback);
            }, delay || throttleDelay);
        }

        function off(event, callback) {
            $(window).off(event, callback);
        }

        function offOnDestroy(event, $scope, callback) {
            $scope.$on("$destroy", function () {
                off(event, callback);
            });
        }

        function getWidth() {
            return $(window).width();
        }

        function getHeight() {
            return $(window).height();
        }

        function getPositionInCenter() {
            var $this = $(window);
            var width = $this.width();
            var height = $this.height();

            var centerX = width / 2;
            var centerY = height / 2;

            return {
                x: centerX,
                y: centerY
            }
        }

        return {
            throttle: throttle,
            on: on,
            onAndOffOnDestroy: onAndOffOnDestroy,
            off: off,
            getWidth: getWidth,
            getHeight: getHeight,
            getPositionInCenter: getPositionInCenter
        }
    });
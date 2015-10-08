angular.module("app").
    factory("_headroom", function ($rootScope) {
        var isEnabled = Headroom.cutsTheMustard;
        var headroom = null;

        function hideHeadroomWithoutAnimation() {
            if (isEnabled) {
                var $headroom = $(".js-header-headroom");

                $headroom.addClass("headroom--unpinned is-no-animation");
                setTimeout(function () {
                    $headroom.removeClass("is-no-animation");
                });
            }
        }

        function show() {
            _emitEvent("pin")
        }

        function freeze() {
            _emitEvent("freeze")
        }

        function unfreeze() {
            _emitEvent("unfreeze")
        }

        function _emitEvent(action, params) {
            if (isEnabled) {
                $rootScope.$emit("headroom:" + action, params);
            }
        }

        return {
            show: show,
            freeze: freeze,
            unfreeze: unfreeze,
            hideHeadroomWithoutAnimation: hideHeadroomWithoutAnimation
        }
    }).
    factory("_header", function ($rootScope, $timeout, _pageConfig, _headroom) {
        var $headerRows = $(".js-header-row");

        function timeoutAndRecalculateHeight() {
            $timeout(recalculateHeight);
        }

        function recalculateHeight() {
            $rootScope.headerHeight = _.reduce($headerRows, function (current, row) {
                return current + row.offsetHeight;
            }, 0);

            $rootScope.contentMarginTop = (_pageConfig.doNotMoveContentByHeaderHeight) ? 0 : $rootScope.headerHeight;
        }

        function getMaxHeight() {
            return 170; //this is approximate value of max header height. It doesn't limit max height of header
        }

        return {
            getMaxHeight: getMaxHeight,
            recalculateHeight: recalculateHeight,
            timeoutAndRecalculateHeight: timeoutAndRecalculateHeight
        }
    }).
    run(function ($rootScope, $timeout, _header, _headroom, _window) {
        _header.recalculateHeight();
        _window.on("resize", _header.recalculateHeight);

        (function freezeHeaderOnFullscreenChanges() {
            $rootScope.$on("fullScreen:opening", function () {
                _headroom.freeze();
            });

            $rootScope.$on("fullScreen:closed", function () {
                $timeout(_headroom.unfreeze, 300);
            });
        })();
    }).
    controller("HeaderController", function ($scope, _pushy, _headroom, _modernizr) {
        $scope.pushy = {
            open: _pushy.open
        };

        $scope.showOnMouseOver = function () {
            if (!_modernizr.touch) {
                _headroom.show();
            }
        };
    });
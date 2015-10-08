angular.module("common").
    factory("_platform", function() {
        var tabletMinDimension = 768;
        var platform;

        //https://coderwall.com/p/i817wa/one-line-function-to-detect-mobile-devices-with-javascript
        function isMobileDevice() {
            return (typeof window.orientation !== "undefined") || (navigator.userAgent.indexOf('IEMobile') !== -1);
        }

        function get() {
            if (!platform) {
                if (!isMobileDevice()) {
                    platform = "pc";
                } else {
                    var $window = $(window);
                    var dimension = Math.min($window.width(), $window.height());

                    if (dimension >= tabletMinDimension) {
                        platform = "tablet";
                    } else {
                        platform = "mobile";
                    }
                }
            }

            return platform;
        }

        return {
            get: get
        }
    }).
    run(function($rootScope, _platform) {
        $rootScope.platform = _platform.get();
    });
angular.module("common").
    directive("cLazyVisible", function ($timeout, _window, _visible) {
        return {
            restrict: "A",
            scope: {
                cLazyVisible: "&"
            },
            link: function ($scope, $element) {
                var triggered = false;

                $timeout(checkVisibilityAndTriggerCallback);

                var callback = _window.throttle(checkVisibilityAndTriggerCallback);

                $scope.$on("$destroy", offListeners);
                $scope.$on("lazy-visible:check", checkVisibilityAndTriggerCallback);

                (function onListeners() {
                    _window.on("resize", callback, true);
                    _window.on("scroll", callback, true);
                })();

                function checkVisibilityAndTriggerCallback() {
                    if (triggered) {
                        $scope.cLazyVisible();
                    } else if (_visible.check($element[0])) {
                        $scope.cLazyVisible();
                        offListeners();

                        triggered = true;
                    }
                }

                function offListeners() {
                    _window.off("resize", callback);
                    _window.off("scroll", callback);
                }
            }
        }
    }).
    factory("_lazyVisible", function ($rootScope) {
        function triggerToCheck($scope) {
            ($scope || $rootScope).$broadcast("lazy-visible:check");
        }

        return {
            triggerToCheck: triggerToCheck
        }
    });
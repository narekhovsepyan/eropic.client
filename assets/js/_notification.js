angular.module("app").
    factory("_notification", function (_i18n) {
        var html_ = null;

        function setHtml(html) {
            html_ = html;
        }

        function translateAndNotify(key, params) {
            setHtml(_i18n(key, params))
        }

        function get() {
            return html_;
        }

        function reset() {
            html_ = null;
        }

        return {
            get: get,
            setHtml: setHtml,
            translateAndNotify: translateAndNotify,
            reset: reset
        }
    }).
    directive("cNotification", function (_promise, _notification) {
        return {
            restrict: "E",
            replace: true,
            template: "<div class='c-notification'>" +
            "<span></span><button ng-click='hide()'>Close</button>" +
            "</div>",
            link: function ($scope, $element) {
                var isDisplayed = false;
                var $span = $element.children("span");
                var chain = _promise.chain();

                $scope.hide = hide;

                $scope.$watch(_notification.get, function (current) {
                    if (current) {
                        show(current);
                    } else {
                        hide();
                    }
                });

                function show(html) {
                    isDisplayed = true;

                    $span.html(html);
                    $element.addClass("is-displayed");

                    chain
                        .then(_promise.tick)
                        .then(function() {
                            $element.addClass("is-displayed-active");
                        });
                }

                function hide() {
                    if (!isDisplayed) return;

                    $element.removeClass("is-displayed-active");
                    isDisplayed = false;

                    chain
                        .then(_promise.sleepFunc(300))
                        .then(function() {
                            $element.removeClass("is-displayed");
                            _notification.reset();
                        });
                }
            }
        }
    });
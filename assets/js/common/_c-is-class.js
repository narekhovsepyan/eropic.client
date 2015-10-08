angular.module("common").
    directive("cIsClass", function () {
        return {
            restrict: "A",
            scope: {
                cIsClass: "="
            },
            link: function ($scope, $element) {
                var prevObj = {};

                $scope.$watch("cIsClass", function (currObj) {
                    var keys = _.keys(currObj);

                    _.each(keys, function (key) {
                        var curr = currObj[key];
                        var prev = prevObj[key];

                        if (curr != prev) {
                            if (prev) {
                                $element.removeClass("is-" + prev + key);
                            }

                            if (curr) {
                                $element.addClass("is-" + curr + key);
                            }
                        }
                    });

                    prevObj = currObj;
                });
            }
        }
    });
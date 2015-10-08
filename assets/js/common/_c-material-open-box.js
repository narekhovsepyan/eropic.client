angular.module("common").
    directive("cMaterialOpenBox", function($timeout) {
        return {
            restrict: "A",
            scope: {
                cMaterialOpenBox: "="
            },
            link: function($scope, $element) {
                var isOpened = false;

                $element.addClass("c-material-open-box");

                function open() {
                    var options = $scope.cMaterialOpenBox || {};
                    var dimension = Math.max(window.innerWidth, window.innerHeight);

                    var top = (getPercentageOf(window.innerHeight, options.top || 50) - dimension/2);
                    var left = (getPercentageOf(window.innerWidth, options.left || 50) - dimension/2);

                    $element.addClass("is-animate");
                    $element.css({
                        width: dimension + "px",
                        height: dimension + "px",
                        top: top,
                        left: left
                    });
                }

                function getPercentageOf(value, percentage) {
                    return Math.floor((value/100) * percentage)
                }

                $scope.$watch("cMaterialOpenBox.show", function(curr) {
                    if (curr && !isOpened) {
                        open();
                    }
                })
            }
        }
    });
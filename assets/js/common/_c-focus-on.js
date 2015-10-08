angular.module('common').
    directive('cFocusOn', function () {
        return {
            restrict: 'A',
            link: function ($scope, $element, attrs) {
                $scope.$on(attrs.cFocusOn, function() {
                    $element.focus();
                });
            }
        }
    });
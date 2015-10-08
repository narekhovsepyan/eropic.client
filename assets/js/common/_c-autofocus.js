angular.module('common').
    directive('cAutofocus', function () {
        return {
            restrict: 'A',
            link: function (scope, element, attrs, ctrl) {
                setTimeout(function() {
                    element.focus();
                }, attrs.cAutofocus ? attrs.cAutofocus : 100)
            }
        }
    });
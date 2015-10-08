/*!
 * headroom.js v0.7.0 - Give your page some headroom. Hide your header until you need it
 * Copyright (c) 2014 Nick Williams - http://wicky.nillia.ms/headroom.js
 * License: MIT
 */

(function(angular) {

    if(!angular) {
        return;
    }

    ///////////////
    // Directive //
    ///////////////

    angular.module('headroom', []).directive('headroom', ['$rootScope', function($rootScope) {
        return {
            restrict: 'EA',
            scope: {
                tolerance: '=',
                offset: '=',
                classes: '=',
                scroller: '@'
            },
            link: function(scope, element) {
                var options = {};
                angular.forEach(Headroom.options, function(value, key) {
                    options[key] = scope[key] || Headroom.options[key];
                });
                if (options.scroller) {
                    options.scroller = angular.element(options.scroller)[0];
                }
                var headroom = new Headroom(element[0], options);
                headroom.init();

                var actionFreeze = $rootScope.$on('headroom:freeze', onFreeze);
                var actionUnfreeze = $rootScope.$on('headroom:unfreeze', onUnfreeze);
                var actionPin = $rootScope.$on('headroom:pin', onPin);

                scope.$on('$destroy', function() {
                    headroom.destroy();
                    actionFreeze();
                    actionUnfreeze();
                    actionPin();
                });

                function onPin() {
                    headroom.pin();
                }

                function onFreeze() {
                    headroom.freeze();
                }

                function onUnfreeze() {
                    headroom.unfreeze();
                }
            }
        };
    }]);

}(window.angular));
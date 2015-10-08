angular.module("common").
    factory("_visibility", function($rootScope) {
        var Visibility = window.Visibility;

        Visibility.changeSafeApply = function(callback) {
            return Visibility.change(function(e, state) {
                $rootScope.$safeApply(function() {
                    callback(e, state);
                })
            });
        };

        return Visibility;
    });
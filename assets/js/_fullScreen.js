angular.module('app').
    factory('_fullScreen', function($rootScope) {
        //var $html = $(document.documentElement);
        var isFullScreen = false;
        var lastChange = null;
        var type_ = null;
        var scrollPosition = -1;

        $rootScope.fullScreenModel = {};

        return {
            open: function(type, model) {
                if (!isFullScreen) {
                    $rootScope.$emit("fullScreen:opening");

                    scrollPosition = $(window).scrollTop();
                    $(document.documentElement).addClass('is-full-screen');
                    $rootScope.fullScreenModel = model;
                    isFullScreen = true;
                    type_ = type;
                    lastChange = new Date();

                    $rootScope.$emit("fullScreen:opened");
                }
            },
            close: function() {
                if (isFullScreen) {
                    $rootScope.$emit("fullScreen:closing", {scrollPosition: scrollPosition});

                    $(document.documentElement).removeClass('is-full-screen');
                    $rootScope.fullScreenModel = {};
                    isFullScreen = false;
                    type_ = null;
                    lastChange = new Date();
                    $(window).scrollTop(scrollPosition);
                    scrollPosition = -1;

                    $rootScope.$emit("fullScreen:closed");
                }
            },
            isEnabled: function(type) {
                return isFullScreen && ((type) ? type == type_ : true);
            },
            getLastChange: function() {
                return lastChange;
            },
            getModel: function(type) {
                return (type == type_) ? $rootScope.fullScreenModel : {};
            }
        }
    });
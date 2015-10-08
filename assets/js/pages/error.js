angular.module("app").
    factory("_pageConfig", function() {
        return {
            doNotMoveContentByHeaderHeight: true
        }
    }).
    run(function($rootScope) {
        $rootScope.pageClass = "page-error";
    });
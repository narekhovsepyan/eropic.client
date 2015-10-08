angular.module("app").
    factory("_5xxInterceptor", function($q, _notification) {
        return {
            responseError: function(rejection) {
                var status = rejection.status;

                if (status >= 500 && status < 600) {
                    _notification.translateAndNotify("other.notification.5xx");
                }

                return $q.reject(rejection);
            }
        }
    }).
    config(function ($httpProvider) {
        $httpProvider.interceptors.push("_5xxInterceptor");
    });
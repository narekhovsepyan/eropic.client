angular.module("app").
    config(function ($provide) {
        $provide.decorator('$exceptionHandler', function ($log, $delegate) {
            return function (exception, cause) {
                //alert(exception); //to debug mobile exceptions
                $delegate(exception, cause);
            };
        });
    });
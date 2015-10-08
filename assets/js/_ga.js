angular.module("app").
    constant("_gaEventsPercentage", 10).
    run(function($rootScope, _ga) {
        //can't use $locationChangeSuccess because of
        //http://stackoverflow.com/questions/31938798/locationchangesuccess-how-to-differ-pushstate-from-replacestate
        $rootScope.$on("_v.url:set", function() {
            _ga.trackPageView();
        })
    });
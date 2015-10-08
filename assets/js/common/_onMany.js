angular.module("common")
    .run(function($rootScope) {
        $rootScope.$onMany = function(events, fn) {
            //http://stackoverflow.com/questions/14833597/listen-for-multiple-events-on-a-scope
            var _this = this;

            angular.forEach(events, function (event) {
                _this.$on(event, fn);
            });
        }
    });
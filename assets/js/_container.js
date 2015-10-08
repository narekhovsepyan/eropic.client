angular.module("app").
    factory("_container", function ($http, _router) {

        function query() {
            return $http.get(_router.site());
        }

        return {
            query: query
        }
    }).
    controller("ContainerController", function ($scope, _container) {
        _container.query().then(function(response){
            if(response.status === 200){
                $scope.sites = response.data.data;
                $scope.totalCount = response.data.totalCount;
            }
        });

    });
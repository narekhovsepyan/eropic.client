angular.module("common").
    factory("_http", function() {
        return {
            getData: function(promise) {
                return function() {
                    return promise.apply(this, arguments).then(function (response) {
                        return response.data;
                    })
                }
            }
        }
    });
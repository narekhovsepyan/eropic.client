angular.module("app").
    constant("_env", (function() {
        var isProd = $(document.documentElement).hasClass("is-env-prod");

        return {
            isProd: function() {
                return isProd;
            },
            isDev: function() {
                return !isProd;
            }
        }
    })());
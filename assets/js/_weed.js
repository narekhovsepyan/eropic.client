angular.module("app").
    factory("_weed", function() {
        function getUrl(weedData, dimension, version) {
            var last;

            last = (version) ? "_" + version : "";
            last = last + "." + dimension;

            return location.protocol + "//" + weedData.server + "/" + weedData.id + last;
        }

        return {
            getUrl: getUrl
        }
    });
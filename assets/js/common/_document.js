angular.module("common").
    factory("_document", function() {
        function setTitle(title) {
            document.title = title;
        }

        return {
            setTitle: setTitle
        }
    });
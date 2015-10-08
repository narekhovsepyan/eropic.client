angular.module("app").
    factory("_page", function () {
        var albumsPerPage = 10;

        function getAlbumsPerPage() {
            return albumsPerPage;
        }

        function getFrom(page) {
            return (page - 1) * albumsPerPage;
        }

        function getPage(from) {
            return Math.floor(from / albumsPerPage);
        }

        function hasMoreItems(currentPage, total) {
            if (!total) {
                return false;
            } else {
                return total > currentPage * albumsPerPage;
            }
        }

        return {
            getAlbumsPerPage: getAlbumsPerPage,
            getFrom: getFrom,
            getPage: getPage,
            hasMoreItems: hasMoreItems
        }
    });
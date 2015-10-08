angular.module("app").
    constant("_galleryRowMinWidth", 768).
    factory("_gallery", function ($rootScope, _window, _galleryRowMinWidth, _lazyVisible) {
        var _layout = "row";
        var albumsPerRow;

        _updateAlbumsPerRow();

        (function setRowLayoutOnSmallDimension() {
            _window.on("resize", function() {
                if (window.innerWidth <= _galleryRowMinWidth) {
                    setLayout("row");
                }
            });
        })();

        function setLayout(layout) {
            if (_layout != layout) {
                _layout = layout;
                _updateAlbumsPerRow();
                $rootScope.$emit("gallery.layout:changed", layout);
            }
        }

        function isLayoutRow() {
            return _layout == "row";
        }

        function getLayout() {
            return _layout;
        }

        function loadAlbumThumbnails(album) {
            _.each(album.thumbnails, function(thumbnail) {
                thumbnail.loadUrl = thumbnail.url;
            });
        }

        function checkAndLoadGalleryThumbnails($scope) {
            _lazyVisible.triggerToCheck($scope);
        }

        function _updateAlbumsPerRow() {
            albumsPerRow = (_layout == "row") ? 1 : 3;
        }

        function getAlbumsPerRow() {
            return albumsPerRow;
        }

        function getRowWidth() {
            return $('.js-albums-crop-width').width() - ((_window.getWidth() < 768) ? 2 : 20);
        }

        return {
            getRowWidth: getRowWidth,
            checkAndLoadThumbnails: checkAndLoadGalleryThumbnails,
            getAlbumsPerRow: getAlbumsPerRow,
            layout: {
                get: getLayout,
                set: setLayout,
                isRow: isLayoutRow
            },
            album: {
                loadThumbnails: loadAlbumThumbnails
            }
        }
    }).
    controller("GalleryCropController", function ($rootScope, $scope, $timeout, _albums, _gallery, _galleryCrop, _albumFullScreen, _promise, _window) {
        var rowHeight = 200;

        $scope.gallery = {};

        updateRowWidth();
        updateGalleryLayout();

        $scope.$watchCollection('albums', function () {
            transformAlbums($scope.albums);
        });

        $rootScope.$on("gallery.layout:changed", function onStyleChange() {
            updateGalleryLayout();
            transformAlbums($scope.albums, true);
            rebuildGalleryOnLayoutChange();
        });

        (function updateRowsOnWindowResize() {
            _window.onAndOffOnDestroy("resize", $scope, function onRowWidthChange() {
                updateRowWidth();
                transformAlbums($scope.albums, true);
            })
        })();

        function updateRowWidth() {
            $scope.gallery.rowWidth = _gallery.getRowWidth();
        }

        function transformAlbums(albums, force) {
            var albumWidth = getAlbumMaxWidth();

            _.each(albums, function (album) {
                if (!album.thumbnails || force) {
                    album.thumbnails = _galleryCrop.getImagesForRowWithFixedHeight(album.photos, albumWidth, rowHeight);
                }
            });

            $timeout(function() {
                _gallery.checkAndLoadThumbnails($scope);
            });

            return albums;
        }

        function updateGalleryLayout() {
            $scope.gallery.layout = _gallery.layout.get();
        }

        function getAlbumMaxWidth() {
            return Math.ceil($scope.gallery.rowWidth/_gallery.getAlbumsPerRow());
        }

        //http://stackoverflow.com/questions/31386092/how-to-rebuild-ng-repeat-when-track-by-value-is-changed
        function rebuildGalleryOnLayoutChange() {
            $scope.albums.length = $scope.albums.length - 1;
        }
    });
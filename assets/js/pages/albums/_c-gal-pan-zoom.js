angular.module("common").
    directive("cGalPanZoom", function($rootScope, _modernizr) {
        return {
            restrict: "A",
            scope: {
                cGalSlide: "="
            },
            link: function($scope, $element) {
                if (!_modernizr.touch) return;

                var isActivated = false;

                $rootScope.$on("c-gal:slide-opened", function(e, slideOpened) {
                    if (!isActivated && slideOpened == $scope.cGalSlide) {
                        activate();
                    }
                });

                function activate() {
                    isActivated = true;

                    $element.panzoom({
                        increment: 0.8,
                        minScale: 1,
                        contain: 'invert',
                        disablePan: true //by default move is disabled
                    });

                    $element.on("panzoomstart", function() {
                        //on zoom enable move and disable lightslider touch
                        $rootScope.$emit("c-gal-pan-zoom:zoom-changed");
                        $element.panzoom("option", {
                            disablePan: false
                        });
                    });

                    $element.on("panzoomend", function(e, panzoom, matrix) {
                        //on initial zoom disable move and enable lightslider touch
                        if (isZoomInitial(matrix)) {
                            $rootScope.$emit("c-gal-pan-zoom:zoom-initial");
                            $element.panzoom("option", {
                                disablePan: true
                            });
                        }
                    });

                    $rootScope.$on("c-gal-pan-zoom.do:reset", function() {
                        $element.panzoom("resetZoom");
                    });

                    $scope.$on("$destroy", function() {
                        $element.panzoom("destroy");
                    });
                }

                function isZoomInitial(matrix) {
                    return matrix[0] == 1 && matrix[3] == 1;
                }

                //var pinch = new Hammer.Pinch();
                //var mc = new Hammer($element[0]);
                //mc.add(pinch);
                //
                //mc.on("pinch", function(ev) {
                //    alert(ev.type);
                //});


            }
        }
    });
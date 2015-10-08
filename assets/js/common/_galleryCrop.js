angular.module("common").
    factory("_galleryCrop", function() {
        function getImagesForRowWithFixedHeight(images, rowWidth, rowHeight) {
            var answer = [];
            var totalWidth = 0;

            _.each(images, function(image, i) {
                if (totalWidth < rowWidth) {
                    var width = Math.floor((image.width*rowHeight)/image.height);

                    totalWidth += width;

                    answer.push({
                        url: image.mediumUrl,
                        type: image.type,
                        width: width,
                        height: rowHeight
                    });
                }
            });

            return answer;
        }

        return {
            getImagesForRowWithFixedHeight: getImagesForRowWithFixedHeight
        }
    });
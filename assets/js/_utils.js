angular.module("app").
    factory("_utils", function() {
        function getRandomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        }

        function ref(obj, str, action) {
            //http://stackoverflow.com/questions/10934664/convert-string-in-dot-notation-to-get-the-object-reference
            str = str.split(".");
            for (var i = 0; i < str.length - 1; i++)
                obj = obj[str[i]];

            if (action) {
                return action(obj, str[str.length - 1])
            } else {
                return obj[str[str.length - 1]];
            }
        }

        return {
            getRandomInt: getRandomInt,
            ref: ref
        }
    });
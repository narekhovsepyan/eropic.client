(function (_v) {
    //$.vUrlToObject($.vObjectToUrl({a: {b: ['1:2', 'hello?world'], c: '=)))'}}))

    var ARRAY_DEFAULT_DELIMITER = "+";
    var _utils = _v.utils;

    _v.Mapper = function(params) {
        var arrayDelimiter = (params || {}).arrayDelimiter || ARRAY_DEFAULT_DELIMITER;
        var _this = {
            objectToUrl: function (obj) {
                obj = _utils.flatten(obj, {safe: true});

                var answer;
                var params = [];
                var query = {};
                var hasSearch = false;

                Object.keys(obj).forEach(function (key) {
                    var value = obj[key];
                    var valueString;

                    if (value !== undefined) {
                        if (key[0] == "_") {
                            query[key.substring(1)] = value;
                            hasSearch = true;
                        } else {
                            valueString = _utils.isArray(value) ? _utils.arrayToString(value, arrayDelimiter) : _utils.encode(value);

                            params.push(key + ":" + valueString)
                        }

                    }
                });

                answer = params.join("/");

                if (hasSearch) {
                    answer += "?" + _utils.paramsToQuery(query);
                }

                return answer;
            },
            urlToObject: function (url) {
                url = (function transformUrl() {
                    if (url[0] != "/" && !_utils.url.hasProtocol(url)) {
                        return "/" + url;
                    } else {
                        return url;
                    }
                })();

                var obj = {};
                var parsedUrl  =_utils.parseURL(url);
                var items = parsedUrl.path.split("/");

                items.forEach(function (item) {
                    if (item) {
                        var keyAndValue = item.split(":");
                        var key = keyAndValue[0];
                        var value = _utils.decode(keyAndValue[1]).split(arrayDelimiter);

                        obj[key] = (value.length == 1) ? value[0] : value;
                    }
                });

                _utils.forEach(parsedUrl.params, function(param, value) {
                    obj["_" + param] = _utils.decode(value);
                });

                return _utils.unflatten(obj);
            }
        };

        return _this;
    };

}(window._v));
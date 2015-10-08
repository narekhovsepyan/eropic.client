(function () {
    var _v = window._v = (window._v || {});

    function parseQueryString(query) {
        var ret = {},
            seg = query.replace(/^\?/, '').split('&'),
            len = seg.length, i = 0, s;
        for (; i < len; i++) {
            if (!seg[i]) {
                continue;
            }
            s = seg[i].split('=');
            ret[s[0]] = s[1];
        }
        return ret;
    }

    function urlNormalize(url) {
        return url.replace("#!", ""); //transform html4 url to html5 url (http://ya/#!no-history-support -> http://ya/no-history-support)
    }

    function parseURL(url) {
        // http://james.padolsey.com/javascript/parsing-urls-with-the-dom/
        // This function creates a new anchor element and uses location
        // properties (inherent) to get the desired URL data. Some String
        // operations are used (to normalize results across browsers).

        var a = document.createElement('a');
        a.href = urlNormalize(url);

        var answer = {
            source: url,
            protocol: a.protocol.replace(':', ''),
            host: a.hostname,
            port: a.port,
            query: a.search,
            params: (function () {
                return parseQueryString(a.search);
            })(),
            file: (a.pathname.match(/\/([^\/?#]+)$/i) || [, ''])[1],
            hash: a.hash.replace('#', ''),
            path: a.pathname.replace(/^([^\/])/, '/$1'),
            relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [, ''])[1],
            segments: a.pathname.replace(/^\//, '').split('/')
        };

        answer.pathAndQuery = answer.path + answer.query;

        return answer;
    }

    function getVimeoPathFromUrl(url) {
        url = urlNormalize(url);
        url = parseURL(url).path;

        var pos = url.indexOf(":");
        var answer = (function () {
            if (pos >= 0) {
                pos = url.substring(0, pos).lastIndexOf("/");
                if (pos >= 0) {
                    return {
                        path: url.substring(0, pos + 1),
                        vimeo: url.substring(pos + 1)
                    }
                } else {
                    return {
                        vimeo: url,
                        path: ""
                    }
                }
            } else {
                return {
                    path: url,
                    vimeo: ""
                }
            }
        })();

        answer.path = answer.path || "/";

        return answer;
    }

    var _this = {
        parseURL: parseURL,

        paramsToQuery: $.param,

        encode: function (obj) {
            return encodeURIComponent(obj);
        },

        decode: function (value) {
            return decodeURIComponent(value);
        },

        isArray: function (obj) {
            return ( Object.prototype.toString.call(obj) === '[object Array]' );
        },

        endsWith: function (str, suffix) {
            return str.indexOf(suffix, this.length - suffix.length) !== -1;
        },

        arrayToString: function (array, delimiter) {
            var params = [];
            var arrayLength = array.length;

            for (var i = 0; i < arrayLength; i++) {
                params.push(_this.encode(array[i]));
            }

            return params.join(delimiter);
        },

        flatten: function (target, opts) {
            opts = opts || {}

            var delimiter = opts.delimiter || '.'
            var output = {}

            function step(object, prev) {
                Object.keys(object).forEach(function (key) {
                    var value = object[key]
                    var isarray = opts.safe && Array.isArray(value)
                    var type = Object.prototype.toString.call(value)
                    var isobject = (
                    type === "[object Object]" ||
                    type === "[object Array]"
                    )

                    var newKey = prev
                        ? prev + delimiter + key
                        : key

                    if (!isarray && isobject) {
                        return step(value, newKey)
                    }

                    output[newKey] = value
                })
            }

            step(target)

            return output
        },

        unflatten: function (target, opts) {
            opts = opts || {}

            var delimiter = opts.delimiter || '.'
            var result = {}

            if (Object.prototype.toString.call(target) !== '[object Object]') {
                return target
            }

            // safely ensure that the key is
            // an integer.
            function getkey(key) {
                var parsedKey = Number(key)

                return (
                isNaN(parsedKey) ||
                key.indexOf('.') !== -1
                ) ? key
                    : parsedKey
            }

            Object.keys(target).forEach(function (key) {
                var split = key.split(delimiter)
                var key1 = getkey(split.shift())
                var key2 = getkey(split[0])
                var recipient = result

                while (key2 !== undefined) {
                    if (recipient[key1] === undefined) {
                        recipient[key1] = (
                            typeof key2 === 'number' && !opts.object ? [] : {}
                        )
                    }

                    recipient = recipient[key1]
                    if (split.length > 0) {
                        key1 = getkey(split.shift())
                        key2 = getkey(split[0])
                    }
                }

                // unflatten again for 'messy objects'
                recipient[key1] = _this.unflatten(target[key], opts)
            })

            return result
        },

        forEach: function (obj, callback) {
            for (var property in obj) {
                if (obj.hasOwnProperty(property)) {
                    callback(property, obj[property], obj);
                }
            }
        },

        url: {
            getPathVimeo: function (url) {
                return getVimeoPathFromUrl(url);
            },
            getVimeo: function (url) {
                return getVimeoPathFromUrl(url).vimeo;
            },
            getPath: function (url) {
                return getVimeoPathFromUrl(url).path;
            },
            hasProtocol: function (url) {
                var protocol = url.substring(0, 7);
                var answer = protocol == "http://" || (protocol == "https:/" && url[7] == "/");

                return answer;
            }
        }
    };

    _v.utils = _this;
})();
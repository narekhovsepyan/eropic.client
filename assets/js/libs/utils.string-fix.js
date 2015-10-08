(function() {
    //http://stackoverflow.com/questions/280634/endswith-in-javascript
    if (typeof String.prototype.endsWith != 'function') {
        String.prototype.endsWith = function (suffix) {
            return this.indexOf(suffix, this.length - suffix.length) !== -1;
        };
    }

    //http://stackoverflow.com/questions/646628/how-to-check-if-a-string-startswith-another-string
    if (typeof String.prototype.startsWith != 'function') {
        String.prototype.startsWith = function (str){
            return this.slice(0, str.length) == str;
        };
    }
})();
_.remove = function(array, element) {
    //http://stackoverflow.com/questions/5767325/remove-specific-element-from-an-array
    var index = array.indexOf(element);
    if (index > -1) {
        array.splice(index, 1);
    }
};

_.empty = function(array) {
    //http://stackoverflow.com/questions/1232040/how-to-empty-an-array-in-javascript
    array.length = 0;
};

_.emptyObject = function(object) {
    _.each(_.keys(object), function(key) {
        delete object[key];
    });
};
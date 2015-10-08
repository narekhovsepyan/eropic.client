var gulp = require("gulp");
var del = require("del");
var path = require("path");
var lazypipe = require("lazypipe");
var $ = require("gulp-load-plugins")({lazy: false});

var paths = {
    html: {
        src: "./src",
        tmp: "./build/tmp/html"
    },
    assets: {
        src: "./assets",
        target: "./build/static/sources/assets"
    },
    target: {
        root: "./build",
        static: "./build/static",
        js: "./build/static/js",
        css: "./build/static/css",
        nginx: "./build/nginx/conf"
    },
    scss: {
        src: "./scss",
        target: "./assets/css/scss/",
        build: "./build/static/css/scss/"
    },
    nginx: {
        root: "./other/nginx/",
        conf: {
            dev: "./other/nginx/dev/",
            prod: "./other/nginx/prod/",
            shared: "./other/nginx/shared/"
        },
        target: "./build/nginx/conf"
    }
};

var _ = {
    vars: {},
    pathAny: function (dir, extension) {
        return path.join(dir, "**/*." + (extension || "*"))
    },
    isProduction: function () {
        return !!_.vars.prod;
    },
    ifProduction: function (doStream) {
        return _.isProduction() ? doStream : gutil.noop();
    },
    isEnv: function (variable) {
        return !($.util.env[variable] === undefined)
    },
    and: function() {
        var funcs = arguments;

        return function() {
            var args = arguments;
            var func;
            var i;

            for(i = 0; i < funcs.length; i++) {
                func = funcs[i];

                if(!func.apply(this, args)) {
                    return false;
                }
            }

            return true;
        }
    }
};

gulp.task("clean", function() {
    return gulp.series("clean:static", "nginx:clean")();
});

gulp.task("clean:static", function (cb) {
    del(paths.target.static, cb);
});

gulp.task("clean:static.assets", function (cb) {
    del([paths.target.js, paths.target.css], cb);
});

gulp.task("scss", function () {
    return gulp.src(_.pathAny(paths.scss.src))
        .pipe($.sourcemaps.init())
        .pipe($.sass({
            includePaths: [paths.scss.src]
        }))
        .pipe($.autoprefixer("last 1 version", "> 1%", "ie 8"))
        .pipe($.sourcemaps.write())
        .pipe(gulp.dest(paths.scss.target));
});

gulp.task("scss.build:clean", function(cb) {
    del(paths.scss.build, cb);
});

gulp.task("scss.build:copy", function (cb) {
    return gulp
        .src(_.pathAny(paths.scss.target))
        .pipe(gulp.dest(paths.scss.build));
});

gulp.task("assets", function() {
    return gulp
        .src(_.pathAny(paths.assets.src))
        .pipe(gulp.dest(paths.target.static))
});

gulp.task("assets.js:copy-original", function() {
    return gulp
        .src(_.pathAny(paths.assets.src, "js"))
        .pipe(gulp.dest(paths.assets.target))
});

gulp.task("assets.without-js-css", function() {
    return gulp
        .src([_.pathAny(paths.assets.src), "!" + _.pathAny(paths.assets.src, "js"), "!" + _.pathAny(paths.assets.src, "css")])
        .pipe(gulp.dest(paths.target.static))
});

gulp.task("html:preprocess", function() {
    var context = {
        environment: (_.isProduction()) ? "prod" : "dev"
    };

    return gulp
        .src(_.pathAny(paths.html.src, "html"))
        .pipe($.preprocess({context: context}))
        .pipe(gulp.dest(paths.html.tmp))
});

gulp.task("html:index", function() {
    return gulp
        .src(path.join(paths.html.tmp, "pages/albums/index.html"))
        .pipe(gulp.dest(paths.html.tmp))
});

gulp.task("html:extend", function() {
    return gulp
        .src(_.pathAny(paths.html.tmp, "html"))
        .pipe($.htmlExtend({annotations: false, verbose: true, root: paths.html.tmp}))
        .pipe(gulp.dest(paths.target.static))
});

gulp.task("html:clean-tmp", function(cb) {
    del(paths.html.tmp, cb);
});

gulp.task("html", gulp.series("html:preprocess", "html:index", "html:extend", "html:clean-tmp"));

gulp.task("useref", function () {
    var options = {
        searchPath: paths.assets.src
    };

    var sourceMapsWriteOptions = {
        sourceRoot: "/sources/",
        sourcePathBase: "/", //https://github.com/floridoo/gulp-sourcemaps/pull/116
        includeContent: false
    };

    var assets = $.useref.assets(options, lazypipe().pipe($.sourcemaps.init, {loadMaps: true}));

    var stream = gulp
        .src(_.pathAny(paths.target.static, "html"))
        .pipe(assets);

    var processJs = lazypipe()
        .pipe($.cached, 'useref.js')
        .pipe($.debug, {title: 'minify:'})
        .pipe($.ngAnnotate, {gulpWarnings: false})
        .pipe($.uglify);

    var processCss = lazypipe()
        .pipe($.cached, 'useref.css')
        .pipe($.minifyCss);

    if (_.isEnv("minify")) {
        stream = stream
            .pipe($.if(css, processCss()))
            .pipe($.if(jsExceptMinified, processJs()))
    }

    function jsExceptMinified(file) {
        var path = file.path;

        return path.endsWith(".js");
    }

    function css(file) {
        return file.path.endsWith(".css");
    }

    return stream
        .pipe($.rev())
        .pipe($.if("*.js", $.sourcemaps.write(".", sourceMapsWriteOptions)))
        .pipe($.if("*.css", $.sourcemaps.write(".", sourceMapsWriteOptions)))
        .pipe(assets.restore())
        .pipe($.useref())
        .pipe($.revReplace())
        .pipe(gulp.dest(paths.target.static))
});

gulp.task("build.dev", gulp.series("clean:static", "scss", "html", "assets"));

gulp.task("build.prod", function() {
    _.vars.prod = true;

    return gulp.series("clean:static", "scss", "html", "useref", "assets.without-js-css", "assets.js:copy-original")();
});

(function nginx() {
    gulp.task("nginx:clean", function (cb) {
        del(paths.nginx.target, cb);
    });

    gulp.task("nginx:dev.conf", function () {
        return gulp
            .src(_.pathAny(paths.nginx.conf.dev))
            .pipe(gulp.dest(paths.nginx.target));
    });

    gulp.task("nginx:prod.conf", function () {
        return gulp
            .src(_.pathAny(paths.nginx.conf.prod))
            .pipe(gulp.dest(paths.nginx.target));
    });

    gulp.task("nginx:shared.conf", function () {
        return gulp
            .src(_.pathAny(paths.nginx.conf.shared))
            .pipe(gulp.dest(paths.nginx.target));
    });

    gulp.task("nginx:dev.reload", $.shell.task(["docker exec pix-nginx nginx -s reload"]));

    gulp.task("nginx.dev", gulp.series("nginx:clean", gulp.parallel("nginx:dev.conf", "nginx:shared.conf", "nginx:dev.reload")));

    gulp.task("nginx.prod", gulp.series("nginx:clean", gulp.parallel("nginx:prod.conf", "nginx:shared.conf")));
}());

(function watch() {
    gulp.task("watch:scss", function() {
        $.watch(_.pathAny(paths.scss.src), gulp.series("scss", "scss.build:clean", "scss.build:copy"))
    });

    gulp.task("watch:assets", function() {
        $.watch([_.pathAny(paths.assets.src), "!" + _.pathAny(paths.scss.target)], gulp.series("clean:static.assets", "assets"))
    });

    gulp.task("watch:html", function() {
        $.watch(_.pathAny(paths.html.src), gulp.series("build.dev"))
    });

    gulp.task("watch:nginx", function() {
        $.watch(_.pathAny(paths.nginx.root), gulp.series("nginx.dev"))
    });

    gulp.task("watch", gulp.series("build.dev", "nginx.dev", gulp.parallel("watch:scss", "watch:assets", "watch:html", "watch:nginx")));
})();

(function utils() {
    String.prototype.endsWith = function(suffix) {
        return this.indexOf(suffix, this.length - suffix.length) !== -1;
    };
})();
//
//gulp.task('extend', function () {
//    return gulp.src('./src/**/*.html')
//        .pipe(extender({annotations: false, verbose: true, root: "./src/"}))
//        .pipe(gulp.dest(paths.target.static))
//});
//
//gulp.task('assets', function () {
//    return gulp.src('./assets/**/*.*')
//        .pipe(gulp.dest(paths.target.static))
//});
//
//gulp.task('build.dev', function (callback) {
//    runSequence('clean', 'extend', 'assets', callback)
//});

//
//gulp.task('watch', ['build.dev', 'nginx.dev'], function () {
//    watch(['./partials/**/*.*', './src/**/*.html', './assets/**/*.*'], function() {
//        runSequence('build.dev')
//    });
//    watch('./other/nginx', function() {
//        runSequence('nginx.dev')
//    })
//});
//
//
//gulp.task('webserver', ['build.dev'], function() {
//    gulp.src(paths.target.static)
//        .pipe(webserver({
//            host: "0.0.0.0",
//            fallback: "/pages/albums/index.html"
//        }));
//});

//gulp.task('browser-sync', ['build.dev'], function() {
//    browserSync.init({
//        ghostMode: false,
//        server: {
//            baseDir: paths.target.static
//        }
//    });
//});
//
//gulp.task('browser-sync.reload', function() {
//    browserSync.reload();
//});

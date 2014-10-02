var gulp = require("gulp");
var pkg = require("./package.json");
var karma = require("karma").server;
var compile = require("./task/compile-gulp");
var es6transpiler = require("gulp-es6-transpiler");
var template = require("gulp-template");
var jshint = require("gulp-jshint");
var symlink = require("gulp-symlink");
var argv = require("yargs").argv;

// make a version number string, e.g. "1.20.3" -> "1020300"
var VERSION = pkg.version.replace(/\.(\d+)/g, function(_, n) {
    return ("000" + n).slice(-3);
});

gulp.task("compile", function() {
    return gulp.src(["src/*.js", "src/**/*.js"], {buffer: false})
        .pipe(compile("better-dom.js"))
        .pipe(template({ pkg: pkg, VERSION_NUMBER: VERSION }))
        .pipe(es6transpiler())
        .pipe(gulp.dest("build/"));
});

gulp.task("lint", function() {
    return gulp.src(["src/*.js", "src/**/*.js", "test/spec/**/*.js", "*.js"])
        .pipe(jshint(".jshintrc"))
        .pipe(jshint.reporter("jshint-stylish"))
        .pipe(jshint.reporter("fail"));
});

gulp.task("symlink", function() {
    return gulp.src("dist/better-dom.htc")
        .pipe(symlink("build/better-dom.htc"));
});

gulp.task("test", ["compile", "symlink", "lint"], function(done) {
    var browsers = ["PhantomJS"];

    if (argv.all) {
        browsers = ["PhantomJS", "Chrome", "ChromeCanary", "Opera", "Safari", "Firefox"];
    } else if (argv.ie8) {
        browsers = ["IE8 - WinXP"];
    } else if (argv.ie9 || argv.ie10 || argv.ie11) {
        var version = argv.ie9 ? "9" : (argv.ie10 ? "10" : "11");

        browsers = ["IE" + version + " - Win7"];
    }

    karma.start({
        browsers: browsers,
        configFile: require.resolve("./conf/karma.conf")
    }, done);
});

gulp.task("dev", ["compile", "symlink", "lint"], function() {
    gulp.watch(["src/*.js", "src/**/*.js"], ["compile"]);

    karma.start({
        // browsers: ["IE8 - WinXP"],
        configFile: require.resolve("./conf/karma.conf"),
        preprocessors: { "build/better-dom.js": "coverage" },
        reporters: ["coverage", "progress"],
        background: true,
        singleRun: false
    });
});

gulp.task("travis", ["compile", "lint"], function(done) {
    karma.start({
        configFile: require.resolve("./conf/karma.conf"),
        preprocessors: { "build/better-dom.js": "coverage" },
        reporters: ["coverage", "dots", "coveralls"],
        coverageReporter: {
            type: "lcovonly",
            dir: "coverage/"
        }
    }, done);
});

gulp.task("sauce", function() {
    // always return 0 for this task
    karma.start({configFile: require.resolve("./conf/karma.conf-ci.js")});
});

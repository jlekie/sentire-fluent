var _ = require('lodash');
var fs = require('fs-extra');
var path = require('path');

var gulp = require('gulp');
var sequence = require('gulp-sequence');
var watch = require('gulp-watch');
var sourcemaps = require('gulp-sourcemaps')
var filter = require('gulp-filter');
var chmod = require('gulp-chmod');
var ts = require('gulp-typescript');
// var babel = require('gulp-babel');

var through = require('through2');
var merge = require('merge2');
var named = require('vinyl-named');

var tsconfig = require('./tsconfig.json')
var tsproj = ts.createProject('tsconfig.json', {
    typescript: require('typescript'),

    declaration: true
});

var targets = {
    'manifests': {
        paths: [ 'package.json', 'README.md', 'LICENSE' ],
        buildTask: function () {
            return gulp.src(this.paths)
                .pipe(gulp.dest('dist'));
        }
    },
    'src/cfg': {
        paths: [ './src/cfg/**/*.json', './src/cfg/**/*.yml' ],
        buildTask: function () {
            return gulp.src(this.paths, { base: 'src' })
                .pipe(gulp.dest('dist'));
        }
    },
    'src/lib': {
        paths: [ './src/*.ts', './src/lib/**/*.ts', './src/bin/**/*.ts', './type-definitions/*.ts' ],
        buildTask: function () {
            var tsResult = gulp.src(this.paths, { base: 'src' })
                .pipe(sourcemaps.init())
                .pipe(relativity({
                    basePath: tsconfig.compilerOptions.baseUrl,
                    paths: _.mapValues(tsconfig.compilerOptions.paths, function (path, key) {
                        return path[0];
                    })
                }))
                .pipe(tsproj());
            
            var binFilter = filter([ 'src/bin/*' ], { restore: true });

            return merge([
                tsResult.js
                    // .pipe(babel({
                    //     compact: false,
                    //     plugins: [
                    //         'transform-es2015-destructuring',
                    //         'transform-es2015-spread',
                    //         'transform-es2015-parameters'
                    //     ]
                    // }))
                    .pipe(binFilter)
                        .pipe(chmod(0755))
                    .pipe(binFilter.restore)
                    .pipe(sourcemaps.write('.'))
                    .pipe(gulp.dest('dist')),
                tsResult.dts
                    .pipe(gulp.dest('dist/defs'))
            ]);
        }
    }
};

gulp.task('default', function (cb) {
    sequence('build')(cb);
});

gulp.task('build', function (cb) {
    sequence('build[clean]', _.map(targets, function (target, key) { return 'build[' + key + ']'; }), 'build[timestamp]', 'build[clean/tmp]')(cb);
});

gulp.task('build[timestamp]', function (cb) {
    fs.writeFile('dist/timestamp', new Date().getTime().toString(), cb);
});

gulp.task('build[clean]', function (cb) {
    sequence([ 'build[clean/tmp]', 'build[clean/dist]' ])(cb);
});
gulp.task('build[clean/tmp]', function (cb) {
    fs.emptyDir('.tmp', cb);
});
gulp.task('build[clean/dist]', function (cb) {
    fs.emptyDir('dist', cb);
});

_.each(targets, function (target, key) {
    if (target.dependencies) {
        gulp.task('build[' + key + ']', _.map(target.dependencies, function (dep) { return 'build[' + dep + ']'; }), _.bind(target.buildTask, target));
    }
    else {
        gulp.task('build[' + key + ']', _.bind(target.buildTask, target));
    }
});
_.each(targets, function (target, key) {
    gulp.task('rebuild[' + key + ']', function (cb) {
        if (target.restart === false) {
            sequence('build[' + key + ']')(cb);
        }
        else {
            sequence('build[' + key + ']', 'build[timestamp]')(cb);
        }
    });
});

gulp.task('watch', function () {
    _.each(targets, function (target, key) {
        if (target.paths) {
            watch(target.paths, function () { sequence('rebuild[' + key + ']')(); });
        }
    });
});

function relativity(options = {}) {
    _.defaults(options, {
        basePath: '.',
        paths: {}
    });

    return through.obj(function (file, encoding, cb) {
        if (file.isNull()) {
            cb(null, file);
        }
        else if (file.isStream()) {
            this.emit('error', new Error('streams not supported'));
        }
        else if (file.isBuffer()) {
            var fileDirPath = path.dirname(file.path);

            var result = String(file.contents);
            _.each(options.paths, function (destPath, srcPath) {
                var replacePath = path.relative(
                    path.resolve(fileDirPath),
                    path.resolve(options.basePath, destPath.replace('*', ''))
                );
                if (replacePath)
                    replacePath = './' + replacePath;
                else
                    replacePath = '.';

                result = result.replace(new RegExp(`(require\\(['"])(${srcPath})(${_.endsWith(srcPath, '*') ? '.*' : ''}['"]\\))`, 'g'), function (match, p1, p2, p3, offset, string) {
                    return p1 + replacePath + '/' + p3;
                });
                result = result.replace(new RegExp(`(import.*['"])(${srcPath})(${_.endsWith(srcPath, '*') ? '.*' : ''}['"])`, 'g'), function (match, p1, p2, p3, offset, string) {
                    return p1 + replacePath + '/' + p3;
                });
                result = result.replace(new RegExp(`(from.*['"])(${srcPath})(${_.endsWith(srcPath, '*') ? '.*' : ''}['"])`, 'g'), function (match, p1, p2, p3, offset, string) {
                    return p1 + replacePath + '/' + p3;
                });
            });

            file.contents = new Buffer(result);

            cb(null, file);
        }
        else {
            cb();
        }
    });
}
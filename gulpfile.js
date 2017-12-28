"use strict"

const gulp = require('gulp')

const _ = require('lodash')
const sourcemaps = require('gulp-sourcemaps')
const gulpTs = require('gulp-typescript')
const ts = require('typescript')
const fs = require('fs')
const concat = require('gulp-concat')
const glob = require('glob')
const plumber = require('gulp-plumber')
const del = require('del')
const run = require('gulp-run')
const shell = require('gulp-shell')
const runSequence = require('run-sequence')
const watch = require('gulp-watch')
const path = require('path')
const os = require('os')

const APP_GLOBS = [
  'src/**/*.ts'
]

const extraTypeScriptOptions = {
  isolatedModules: false
}

const tsProject = gulpTs.createProject('./tsconfig.json', extraTypeScriptOptions)
const fastTSProject = gulpTs.createProject('./tsconfig.json', Object.assign({}, extraTypeScriptOptions, { isolatedModules: true }))

const isUnitTestGlob = (globPattern) => globPattern.endsWith('unit.ts') || globPattern.endsWith('unit.js')
const isIntegrationTestGlob = (globPattern) => globPattern.endsWith('integration.ts') || globPattern.endsWith('integration.js')
const isTestGlob = (globPattern) => {
  const directoryChain = globPattern.split(path.sep)
  return directoryChain.indexOf('tests') > -1
    || isUnitTestGlob(globPattern)
    || isIntegrationTestGlob(globPattern)
}

const getDestinationGlob = (globPattern) => {
  if (globPattern) {
    const directoryChain = globPattern.split(path.sep)
    const distIdx = directoryChain.indexOf('dist')
    if (distIdx > -1) return globPattern
    const srcIdx = directoryChain.indexOf('src')
    directoryChain[srcIdx] = 'dist'
    const filename = directoryChain[directoryChain.length - 1]
    if (filename.length > 2 && filename.indexOf('.ts') === filename.length - 3) {
      directoryChain[directoryChain.length - 1] = filename.slice(0, filename.length - 3) + '.js'
    }
    return  directoryChain.join(path.sep)
  }
}

const isPathWithinDestination = (filepath) => {
  const directoryChain = filepath.split(path.sep)
  return directoryChain.indexOf('dist') > -1
}

const compileTypescript = (tsProject, globs) => {
  var tsReporter = gulpTs.reporter.defaultReporter()
  var oldErrorLog = tsReporter.error.bind(tsReporter.error)
  var oldFinisher = tsReporter.finish.bind(tsReporter.finish)

  var warningCodes = ['TS2529']
  var ansiColors = {
    red: '\u001b[31m',
    yellow: '\u001b[33m'
  }

  var cachedWarnings = []
  tsReporter.error = function(error) {
    if (_.reduce(warningCodes, (isWarning, code) => isWarning || error.message.indexOf(`error ${code}`) > -1, false)) {
      error.message = error.message.replace(ansiColors.red, ansiColors.yellow)
      cachedWarnings.push(error)
    } else {
      oldErrorLog(error)
    }
  }

  tsReporter.finish = function(results) {
    if (cachedWarnings.length > 0) {
      for(var error of cachedWarnings) {
        oldErrorLog(error)
      }
    }
    return oldFinisher(results)
  }

  var tsResult = gulp.src(globs)
    .pipe(sourcemaps.init())
    .pipe(plumber())
    .pipe(tsProject(tsReporter))

  return tsResult.js
    .pipe(sourcemaps.write({
      mapSources: (sourcePath) => `${__dirname}/src/${sourcePath}`
    }))
    .pipe(gulp.dest('dist'))
}

gulp.task('default', (done) => {
  runSequence('build', () => {
    gulp.watch('src/**/*.{js,ts,json}', { debounceDelay: 100 }, ['build']);
  })
})

gulp.task('typescript-app', () => {
  return compileTypescript(tsProject, APP_GLOBS)
})

gulp.task('copy-dangling', () => {
  return gulp.src([
    'src/**/*.json',
    'src/**/*.pug',
    'src/**/*.sql'
  ])
    .pipe(gulp.dest('dist'))
})

gulp.task('build', (done) => {
  runSequence('clean', 'typescript-app', 'copy-dangling', () => {
    done()
  })
})

gulp.task('build-watch', () => {
  return watch('src/**/*.ts', {ignoreInitial: false}, () => {
    gulp.start('build')
  })
})

gulp.task('clean', function() {
  return del([
    'dist/*'
  ])
})

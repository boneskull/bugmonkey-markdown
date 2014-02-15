/*global module:false*/
var path = require('path');

module.exports = function (grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      main: {
        files: {
          'build/fogbugz-bugmonkey-markdown.min.js': ['<%= pkg.main %>'],
          'build/showdown.min.js': [
            'bower_components/showdown/src/showdown.js'
          ],
          'build/prettify.min.js': [
            'bower_components/showdown/src/extensions/prettify.js'
          ]
        }
      }
    },
    watch: {
      options: {
        atBegin: true
      },
      all: {
        files: [
          '<%=pkg.main%>', 'fogbugz-bugmonkey-markdown.css', 'Gruntfile.js',
          'header.txt', 'bower_components/**/*'
        ],
        tasks: ['default']
      }
    },
    filetransform: {
      options: {
        reduce: function reduce(results) {
          var jsDone = false, cssDone = false;
          return results.map(function concatForBugMonkey(result) {
            var contents = result.contents;
            switch (path.extname(result.filepath)) {
              case '.txt':
                return contents;
              case '.js':
                if (jsDone) {
                  return contents;
                }
                jsDone = true;
                return '\n\njs:\n\n' + contents;
              case '.css':
                if (cssDone) {
                  return contents;
                }
                cssDone = true;
                return '\n\ncss:\n\n' + contents;
              default:
                throw new Error('unrecognized extension: "' +
                  path.extname(result.filepath) + '"');
            }
          }).join('');

        }
      },
      production: {
        dest: 'dist/bugmonkey-markdown.min.txt',
        src: [
          'header.txt',
          'bower_components/jquery.preempt/jquery.preempt.min.js',
          'build/showdown.min.js',
          'build/fogbugz-bugmonkey-markdown.min.js',
          // this must be loaded after our main script because we have to
          // stuff Showdown into the window object.
          'build/prettify.min.js',
          'build/fogbugz-bugmonkey-markdown.min.css'
        ]
      },
      development: {
        dest: 'dist/bugmonkey-markdown.txt',
        src: [
          'header.txt',
          'bower_components/jquery.preempt/jquery.preempt.js',
          'bower_components/showdown/src/showdown.js',
          'fogbugz-bugmonkey-markdown.js',
          'bower_components/showdown/src/extensions/prettify.js',
          'fogbugz-bugmonkey-markdown.css'
        ]
      }
    },
    cssmin: {
      main: {
        files: {
          'build/fogbugz-bugmonkey-markdown.min.css': [
            'fogbugz-bugmonkey-markdown.css'
          ]
        }
      }
    },

    bump: {
      options: {
        files: ['package.json', 'bower.json'],
        updateConfigs: ['pkg'],
        commit: true,
        commitMessage: 'Release v%VERSION%',
        commitFiles: ['-a'], // '-a' for all files
        createTag: true,
        tagName: 'v%VERSION%',
        tagMessage: 'Version %VERSION%',
        push: true,
        pushTo: 'origin'
      }
    }
  });

// These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-filetransform');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-bump');

// Default task.
  grunt.registerTask('default', ['uglify', 'cssmin', 'filetransform']);

};

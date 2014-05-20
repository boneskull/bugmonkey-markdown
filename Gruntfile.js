/*global module:false*/
var path = require('path');

module.exports = function (grunt) {
  'use strict';

  var prereqs = grunt.file.readJSON('prereqs.json');

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      main: {
        files: {
          'build/bugmonkey-markdown.min.js': prereqs.js.map(function (file) {
            return 'build/bower_components/' + file;
          }).concat([
              '<%= pkg.main %>'
            ])
        }
      }
    },
    watch: {
      options: {
        atBegin: true
      },
      all: {
        files: [
          '<%=pkg.main%>', 'bugmonkey-markdown.css', 'Gruntfile.js',
          'header.txt'
        ],
        tasks: ['default']
      }
    },
    cssmin: {
      main: {
        files: {
          'build/bugmonkey-markdown.min.css': prereqs.css.map(function (file) {
            return 'build/bower_components/' + file;
          }).concat(['bugmonkey-markdown.css'])
        }
      }
    },

    bump: {
      options: {
        files: ['package.json'],
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
    },
    clean: ['build'],
    concat: {
      phase1: {
        files: {
          'build/phase1.min.txt': 'header.txt',
          'build/phase1.txt': 'header.txt'
        }
      },
      phase2: {
        options: {
          banner: '\n\njs:\n\n'
        },
        files: {
          'build/phase2.min.txt': [
            'build/bugmonkey-markdown.min.js'
          ],
          'build/phase2.txt': prereqs.js.map(function (file) {
            return 'build/bower_components/' + file;
          }).concat([
              'bugmonkey-markdown.js'
            ])
        }
      },
      phase3: {
        options: {
          banner: '\n\ncss:\n\n'
        },
        files: {
          'build/phase3.min.txt': [
            'build/bugmonkey-markdown.min.css'
          ],
          'build/phase3.txt': prereqs.css.map(function (file) {
            return 'build/bower_components/' + file;
          }).concat([
              'bugmonkey-markdown.css'
            ])
        }
      },
      phase4: {
        files: {
          'dist/bugmonkey-markdown.min.txt': [
            'build/phase*.min.txt'
          ],
          'dist/bugmonkey-markdown.txt': [
            'build/phase?.txt'
          ]
        }
      }
    },
    bower: {
      install: {},
      options: {
        bowerOptions: {
          production: false
        }
      }
    }

  });

  require('matchdep').filterDev(
    ['grunt-*']).forEach(grunt.loadNpmTasks);

// Default task.
  grunt.registerTask('default', [
    'clean',
    'bower',
    'uglify',
    'cssmin',
    'concat'
  ]);

};

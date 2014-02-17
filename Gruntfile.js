/*global module:false*/
var path = require('path');

module.exports = function (grunt) {
  'use strict';

  var prereqs = grunt.file.readJSON('prereqs.json'),
    basenames = prereqs.js.map(function (url) {
      return path.join('build', 'prereqs', path.basename(url));
    });

  // Project configuration.
  grunt.initConfig({
    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      main: {
        files: {
          'build/bugmonkey-markdown.min.js': basenames.concat([
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
          'build/bugmonkey-markdown.min.css': [
            'build/prereqs/*.css', 'bugmonkey-markdown.css'
          ]
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
    'curl-dir': {
      'build/prereqs': prereqs.js.concat(prereqs.css)
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
          'build/phase2.txt': basenames.concat([
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
          'build/phase3.txt': [
            'build/prereqs/*.css',
            'bugmonkey-markdown.css'
          ]
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
    }

  });

  require('matchdep').filterDev(
    ['grunt-*']).forEach(grunt.loadNpmTasks);

// Default task.
  grunt.registerTask('default', [
    'clean',
    'curl-dir',
    'uglify',
    'cssmin',
    'concat:phase1',
    'concat:phase2',
    'concat:phase3',
    'concat:phase4'
  ]);

};

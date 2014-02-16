/**
 * Converts Markdown-generated code blocks to blocks for FogBugz/Kiln which
 * are then auto-highlighted by FogBugz upon display.
 */

(function () {
  'use strict';

  var fogbugz = function () {
    return [
      {
        type: 'output',
        filter: function (source) {
          return source.replace(/<pre><code.*?>([\s\S]+)<\/code><\/pre>/gi,
            function (match, code) {
              return '<p>\n&lt;code&gt;</p>\n' + code.split('\n').map(function (line) {
                return '<div>' + line.replace(/\s\s/g, '&nbsp; ') + '</div>';
              }).join('\n') + '<div>\n&lt;/code&gt;</div>';
            });
        }
      }
    ];
  };

  // Client-side export
  if (typeof window !== 'undefined' && window.Showdown &&
    window.Showdown.extensions) {
    window.Showdown.extensions.fogbugz = fogbugz;
  }
  // Server-side export
  if (typeof module !== 'undefined') {
    module.exports = fogbugz;
  }

}());

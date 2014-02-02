/**
 * BugMonkey Markdown (FogBugz Customization)
 * @author Christopher Hiller <chiller@badwing.com>
 * @description Paired with a GitHub API key, this customization will allow you to use syntax-highlighted Markdown in the plain text editor.
 * @license MIT
 */
(function () {
  'use strict';

  /**
   * URL of CodeMirror script
   * @type {string}
   */
  var CODEMIRROR_SCRIPT = '//cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/codemirror.min.js',

    /**
     * @desc List of other necessary script URLs.
     *
     * GFM needs Markdown and Overlay to do anything.  XML, Javascript, Python and Shell all enable embedded syntax highlighting.
     *
     * @type {string[]}
     */
      SCRIPTS = [
      '//cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/mode/markdown/markdown.min.js',
      '//cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/mode/gfm/gfm.min.js',
      '//cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/addon/mode/overlay.min.js',
      '//cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/mode/xml/xml.min.js',
      '//cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/mode/javascript/javascript.min.js',
      '//cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/mode/python/python.min.js',
      '//cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/mode/shell/shell.min.js'
    ],

    /**
     * @desc List of CSS urls
     * @type {string[]}
     */
      CSS = [
      // xq-light codemirror theme
      '//cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/theme/xq-light.min.css',

      // default codemirror css (necessary?)
      '//cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/codemirror.min.css'
    ],

    /**
     * @desc Selector for the "OK" button
     * @type {string}
     */
      SEL_OK = '#Button_OKEdit',

    /**
     * @desc Selector for the main textarea
     * @type {string}
     */
      SEL_EDIT = '#sEventEdit',

    /**
     * @desc Selector for the "Plain Text" link/btn
     * @type {string}
     */
      SEL_PLAIN_BTN = '.virtualLink:eq(0)',

    /**
     * @desc elector for the "Rich Text" link/btn
     * @type {string}
     */
      SEL_RTE_BTN = '.virtualLink:eq(1)',

    /**
     * @desc Selector for the parent of the plain/rich link/btns
     * @type {string}
     */
      SEL_MODE_SELECTOR = '.editModeSelector',

    /**
     * @desc URL to the Markdown API
     * @type {string}
     */
      MARKDOWN_API_URL = 'https://api.github.com/markdown',

    /**
     * @desc Message to be displayed when the customization turns itself off
     * @type {string}
     */
      DISABLED_MSG = 'No token entered.  BugMonkey Markdown temporarily disabled.',

    /**
     * @desc Replacement "OK" button to do the API call.  We fully replace the "OK" button with this because some browsers (and jQuery) are fussy about changing the "type" of an <input> element.
     * @type {jQuery}
     */
      $NEW_OK = $(
      '<input class="actionButton2 dlgButton" style="text-align: center" id="Button_OKEdit" name="OK" value="OK"/>'
    ),

    /**
     * @desc Key to use for storing the user's API key in localStorage
     * @type {string}
     */
      TOKEN_KEY = 'BugMonkey.Markdown.GH_TOKEN',

    /**
     * @desc Future reference to main <form> element
     * @type {jQuery}
     */
      $FORMBUGEDIT,

    /**
     * @desc Future reference to "OK" button
     * @type {jQuery}
     */
      $OK,

    /**
     * @desc Future reference to main textarea
     * @type {jQuery}
     */
      $EDIT,

    /**
     * @desc Future CodeMirror editor instance
     * @type {?}
     */
      cm_editor,

    /**
     * @desc Future reference to localStorage
     * @type {Storage}
     */
      ls,

    /**
     * @desc When the page is ready, this function is run.  Initializes a token if appropriate, and watches the DOM for the "plain text" link/btn
     */
      setup = function setup() {
      ls = window.localStorage;
      $FORMBUGEDIT = $('#formBugEdit');

      if (!ls) {
        window.alert('BugMonkey Markdown requires localStorage.  Please use a newer browser.');
        return;
      }

      if (!ls[TOKEN_KEY]) {
        ls[TOKEN_KEY] = window.prompt(
          'To use BugMonkey Markdown, you need a GitHub Personal Access Token.  Visit https://github.com/settings/applications and create a Personal Access Token.  Paste that token here.'
        );
      }

      if (!ls[TOKEN_KEY]) {
        window.alert(DISABLED_MSG);
        return;
      }

      if (!$FORMBUGEDIT.length) {
        console.warn('BugMonkey Markdown: not on a bug page');
        return;
      }

      $(SEL_PLAIN_BTN).waitUntilExists(watchEditors, true);
    },

    /**
     * @desc Binds events to call the Markdown API.  Intializes the CodeMirror editor.
     * @returns {boolean} True/false whether to continue propagation
     */
      bind = function bind() {
      if ($OK.is(':visible')) {
        $OK.after($NEW_OK);
        $OK.detach();

        $NEW_OK.click(getMarkdown);

        // meta/ctrl-enter will submit the form
        $EDIT.keydown(function onKeydown(evt) {
          if (evt.which === 13 && (evt.metaKey || evt.ctrlKey)) {
            getMarkdown();
          }
        });

        // Stops propagation if you press "`", I think.  The FB default code snippet key is "`" and "`" is used often in Markdown.
        $EDIT.keypress(function onKeypress(evt) {
          if (evt.which === 96) {
            return false;
          }
        });

        cm_editor = window.CodeMirror.fromTextArea($EDIT[0], {
          mode: 'gfm' // Github Flavored Markdown
        });

        console.info('BugMonkey Markdown: initialized CodeMirror editor');
      } else {
        console.warn('BugMonkey Markdown: already attached');
      }
      return true;
    },

    /**
     * @des Undoes what we did in bind()
     */
      unbind = function unbind() {
      $NEW_OK.after($OK);
      $('.CodeMirror').remove();
      $NEW_OK.remove();
      console.info('BugMonkey Markdown: destroyed editor (cannot use in RTE)');
    },

    /**
     * @desc Binds bind/unbind functions to clicks of the mode secltors.  If RTE is not present, binds by default.
     */
      watchEditors = function watchEditors() {
      /**
       * Reference to the mode selector parent
       * @type {jQuery}
       */
      var $MODE_SELECTOR = $(SEL_MODE_SELECTOR);
      $OK = $(SEL_OK);
      $EDIT = $(SEL_EDIT);

      if (!$EDIT.hasClass('richtextarea')) {
        bind();
      }

      $MODE_SELECTOR.on('click', SEL_RTE_BTN, {}, unbind)
        .on('click', SEL_PLAIN_BTN, {}, bind);

    },
    /**
     * @desc Retrieves CSS at URL <code>href</code> and adds to the <head>
     * @param {string} href URL of CSS to get
     */
      getCSS = function getCSS(href) {
      $('<link/>', {
        rel: 'stylesheet',
        type: 'text/css',
        href: href
      }).appendTo('head');
    },

    /**
     * @desc When you click "OK", this will convert Markdown to HTML, then submit the form.
     */
      getMarkdown = function getMarkdown() {
      /**
       * @desc Future contents of the text area (Markdown)
       * @type {string}
       */
      var contents,

        /**
         * @desc Actually make the request against the API and submit the form.
         */
          makeRequest = function makeRequest() {
          $.ajax({
            url: MARKDOWN_API_URL,
            type: 'POST',
            contentType: 'application/json',
            dataType: 'json',
            data: JSON.stringify({
              text: contents,
              mode: 'gfm'
            }),
            headers: {
              // this is apparently how you do basic auth against GitHub API
              Authorization: 'Basic ' + window.btoa(ls[TOKEN_KEY] + ':')
            },
            statusCode: {
              /**
               * @desc If OK, set the form to use HTML.  Set the text area to the value of the HTML.  Finally, trigger the default "OK" action.
               * @param {?} res jQuery Response Object
               */
              200: function twoHundred(res) {
                $FORMBUGEDIT.append('<input name="sEvent_sFormat" type="hidden" value="html"/>');
                $EDIT.val(res.responseText);
                unbind();
                $OK.trigger('click');
              },

              /**
               * @desc If unauthorized, asks for key again.
               */
              401: function fourOhOne() {
                delete ls[TOKEN_KEY];

                ls[TOKEN_KEY] = window.prompt(
                  'Invalid Github Personal Access Token.  Visit http://github.com/settings/applications, generate a new one, and paste it here.'
                );

                if (!ls[TOKEN_KEY]) {
                  window.alert(DISABLED_MSG);
                  unbind();
                }

                makeRequest();
              }
            }
          });

        };

      // save contents of CodeMirror to the textarea, then get those contents.
      // TODO: can probably just ask CodeMirror for the contents.
      cm_editor.save();
      contents = $EDIT.val();

      // refuse to submit an empty edit
      if (!$.trim(contents)) {
        window.alert('Please enter some text.');
        return;
      }

      makeRequest();
    };

  // gather CSS
  CSS.forEach(getCSS);

  // we need codemirror.js first, and then secondary scripts, in any order.
  $.getScript(CODEMIRROR_SCRIPT)
    .then(function getAllScripts() {
      return $.when.apply($, SCRIPTS.map(function getAScript(script) {
        return $.getScript(script);
      }));
    })
    .then(function callSetup() {
      // only once we have all our resources are we ready
      console.info('BugMonkey Markdown: ready');
      $(setup);
    })
    .fail(function fatal(err) {
      console.error(err);
    });

// BEGIN THIRD-PARTY PLUGIN(S)

// jquery.waituntilexists.js: https://gist.github.com/PizzaBrandon/5709010
  (function ($, window) {

    var intervals = {};
    var removeListener = function (selector) {

      if (intervals[selector]) {

        window.clearInterval(intervals[selector]);
        intervals[selector] = null;
      }
    };
    var found = 'waitUntilExists.found';

    /**
     * @function
     * @property {object} jQuery plugin which runs handler function once specified
     *           element is inserted into the DOM
     * @param {function|string} handler
     *            A function to execute at the time when the element is inserted or
     *            string "remove" to remove the listener from the given selector
     * @param {bool} shouldRunHandlerOnce
     *            Optional: if true, handler is unbound after its first invocation
     * @example jQuery(selector).waitUntilExists(function);
     */

    $.fn.waitUntilExists = function (handler, shouldRunHandlerOnce, isChild) {

      var selector = this.selector;
      var $this = $(selector);
      var $elements = $this.not(function () {
        return $(this).data(found);
      });

      if (handler === 'remove') {

        // Hijack and remove interval immediately if the code requests
        removeListener(selector);
      } else {

        // Run the handler on all found elements and mark as found
        $elements.each(handler).data(found, true);

        if (shouldRunHandlerOnce && $this.length) {

          // Element was found, implying the handler already ran for all
          // matched elements
          removeListener(selector);
        } else if (!isChild) {

          // If this is a recurring search or if the target has not yet been
          // found, create an interval to continue searching for the target
          intervals[selector] = window.setInterval(function () {

            $this.waitUntilExists(handler, shouldRunHandlerOnce, true);
          }, 250);
        }
      }

      return $this;
    };

  }(jQuery, window));

})();


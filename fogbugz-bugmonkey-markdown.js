/*global Showdown, hljs*/

/**
 * BugMonkey Markdown (FogBugz Customization)
 * @author Christopher Hiller <chiller@badwing.com>
 * @description Leveraging {@link https://github.com/coreyti/showdown Showdown}, this customization will allow you to use syntax-highlighted {@link https://daringfireball.net/projects/markdown/ Markdown} in the plain text editor.
 * @license MIT
 */
(function (jQuery, window) {
  'use strict';

  // we need this to use the prettify extension
  window.Showdown = Showdown;

  var CODEMIRROR_URL_BASE = '//cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/',

    /**
     * URL of CodeMirror script
     * @type {string}
     */
      CODEMIRROR_SCRIPT = CODEMIRROR_URL_BASE + 'codemirror.min.js',

    /**
     * @description List of other necessary script URLs.
     *
     * GFM needs Markdown and Overlay to do anything.  XML, Javascript, Python and Shell all enable embedded syntax highlighting.
     *
     * @type {string[]}
     */
      SCRIPTS = [
      CODEMIRROR_URL_BASE + '/mode/markdown/markdown.min.js',
      CODEMIRROR_URL_BASE + '/mode/gfm/gfm.min.js',
      CODEMIRROR_URL_BASE + '/addon/mode/overlay.min.js',
      CODEMIRROR_URL_BASE + '/mode/xml/xml.min.js',
      CODEMIRROR_URL_BASE + '/mode/javascript/javascript.min.js',
      CODEMIRROR_URL_BASE + '/mode/python/python.min.js',
      CODEMIRROR_URL_BASE + '/mode/shell/shell.min.js'
    ],

    HLJS_URL_BASE = '//yandex.st/highlightjs/8.0',

    HLJS_URL = HLJS_URL_BASE + '/highlight.min.js',

    /**
     * @description List of CSS urls
     * @type {string[]}
     */
      CSS = [
      // xq-light codemirror theme
      CODEMIRROR_URL_BASE + '/theme/xq-light.min.css',

      // default codemirror css (necessary?)
      CODEMIRROR_URL_BASE + '/codemirror.min.css',

      HLJS_URL_BASE + '/styles/atelier-forest.light.min.css'
    ],

    NAMESPACE = 'BugMonkey.Markdown',

    ID_TEXTAREA = 'sEventEdit',

    /**
     * @description Selector for the main textarea
     * @type {string}
     */
      SEL_TEXTAREA = '#' + ID_TEXTAREA,

    SEL_FORM = '#formBugEdit',

    SEL_CONTAINER = '#bugviewContainerEdit',

    SEL_CODEMIRROR = '.CodeMirror',

    SEL_ACTIONBTNS = '.actionButton2[value!="Cancel"]',
//SEL_ACTIONBTNS = '#Button_OKEdit',
    CLS_RTE = 'richtextarea',

    CLS_BUGEVENT = 'bugevent',

    SEL_BUGEVENT = '.' + CLS_BUGEVENT,

    /**
     * @description Future CodeMirror editor instance
     * @type {?}
     */
      cm_editor,

    NS_CLICK = 'click.' + NAMESPACE,

    bound = false,

    $sFormat = $('<input name="sEvent_sFormat" type="hidden" value="html"/>'),

    textareaObserver,

    /**
     * @description When the page is ready, this function is run.  Initializes a token if appropriate, and watches the DOM for the "plain text" link/btn
     */
      setup = function setup() {
      var $container,
        $textarea,
        $formBugEdit = $(SEL_FORM),
        containerObserver,
        fRichEdit = window.localStorage.fRichEdit,

        /**
         * @description Binds events to call the Markdown API.  Intializes the CodeMirror editor.
         */
          bind = function bind() {
          var $textarea = $(SEL_TEXTAREA);

          if (!$textarea.length) {
            return;
          }
          cm_editor = window.CodeMirror.fromTextArea($textarea[0], {
            mode: 'gfm', // Github Flavored Markdown
            lineWrapping: true,
            tabindex: $textarea.attr('tabindex')
          });

          // Stops propagation if you press "`", I think.  The FB default code snippet key is "`" and "`" is used often in Markdown.
          $textarea.keypress(function onKeypress(evt) {
            if (evt.which === 96) {
              return false;
            }
          });

          $(SEL_ACTIONBTNS).preempt({
            attr: 'onclick',
            event: NS_CLICK,
            before: getMarkdown,
            after: unbind
          });

          $(SEL_FORM).append($sFormat);

          console.info('BugMonkey Markdown: initialized CodeMirror editor');
          bound = true;
        },

        /**
         * @description Undoes what we did in bind()
         * @returns {boolean}
         */
          unbind = function unbind() {
          $(SEL_ACTIONBTNS).preempt({
            attr: 'onclick',
            event: NS_CLICK,
            restore: true
          });
          $(SEL_CODEMIRROR).remove();
          $sFormat.remove();
          console.info('BugMonkey Markdown: destroyed editor');
          bound = false;
          highlight();
        },

        textareaMutationHandler = function textareaMutationHandler(mutation) {
          var target = mutation.target,
            $target = $(target);
          if (target.id === ID_TEXTAREA) {
            if (bound && $target.hasClass(CLS_RTE)) {
              return unbind();
            }
            if (!bound && !$target.hasClass(CLS_RTE)) {
              bind();
            }
          }

        },

        containerMutationHandler = function containerMutationHandler(mutation) {
          var addedNodes,
            removedNodes,
            i,
            $bugevent = $(SEL_BUGEVENT),
            node;

          mutation = mutation || {
            addedNodes: $bugevent.length ? [$bugevent[0]] : [],
            removedNodes: []
          };
          addedNodes = mutation.addedNodes;
          removedNodes = mutation.removedNodes;
          i = addedNodes.length;

          while (i--) {
            node = addedNodes[i];
            if (node.className === CLS_BUGEVENT && !bound) {
              if (fRichEdit !== 'true') {
                bind();
              }
              $textarea = $(SEL_TEXTAREA);
              textareaObserver.observe($textarea[0], {
                attributes: true
              });
              break;
            }
          }
          i = removedNodes.length;
          while (i--) {
            node = removedNodes[i];
            if (node.className === CLS_BUGEVENT && bound) {
              unbind();
              break;
            }
          }
        },

        /**
         * @description When you click "OK", this will convert Markdown to HTML, then submit the form.
         */
          getMarkdown = function getMarkdown() {
          /**
           * @description Future contents of the text area (Markdown)
           * @type {string}
           */
          var contents,
            $textarea = $(SEL_TEXTAREA);

          // save contents of CodeMirror to the textarea, then get those contents.
          // TODO: can probably just ask CodeMirror for the contents.
          cm_editor.save();
          contents = $textarea.val();

          $textarea.val(new Showdown.converter({extensions: [
            'prettify'
          ]}).makeHtml(contents));
        };


      if (!$formBugEdit.length) {
        console.warn('BugMonkey Markdown: not on a bug page');
        return;
      }

      $container = $(SEL_CONTAINER);

      containerObserver =
        new MutationObserver(function mutationIterator(mutations) {
          mutations.forEach(containerMutationHandler);
        });

      textareaObserver =
        new MutationObserver(function mutationIterator(mutations) {
          mutations.forEach(textareaMutationHandler);
        });

      containerObserver.observe($container[0], {
        childList: true
      });

      // in the case they clicked the 'edit' button before we were ready,
      // see if the textarea already exists.
      containerMutationHandler();

    },

    /**
     * @description Retrieves CSS at URL <code>href</code> and adds to the <head>
     * @param {string} href URL of CSS to get
     */
      getCSS = function getCSS(href) {
      $('<link/>', {
        rel: 'stylesheet',
        type: 'text/css',
        href: href
      }).appendTo('head');
    },

    highlight = function highlight() {
      $('pre code').each(function () {
        hljs.highlightBlock(this);
      });
    };

  // gather CSS
  CSS.forEach(getCSS);

  // we need codemirror.js first, and then secondary scripts, in any order.
  $.getScript(HLJS_URL)
    .then(function () {
      $(highlight);
    });
  $.getScript(CODEMIRROR_SCRIPT)
    .then(function getAllScripts() {
      return $.when.apply($, SCRIPTS.map(function getAScript(script) {
        return $.getScript(script);
      }));
    })
    .then(function setupWhenReady() {
      // only once we have all our resources are we ready
      console.info('BugMonkey Markdown: fit to get my party on');

      // wait for document ready, whatever that is.
      $(setup);
    })
    .fail(function fatal(err) {
      console.error(err);
    });


})(jQuery, window);


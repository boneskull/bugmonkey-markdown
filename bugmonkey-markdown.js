/*global Showdown*/

/**
 * BugMonkey Markdown (FogBugz Customization)
 * @author Christopher Hiller <chiller@badwing.com>
 * @description Leveraging {@link https://github.com/coreyti/showdown Showdown}, this customization will allow you to use syntax-highlighted {@link https://daringfireball.net/projects/markdown/ Markdown} in the plain text editor.
 * @license MIT
 */
(function (jQuery, window) {
  'use strict';

  var NAMESPACE = 'BugMonkey.Markdown',

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
            theme: localStorage[NAMESPACE + '.THEME_NAME'] || 'default',
            tabindex: $textarea.attr('tabindex'),
            extraKeys: {
              'Cmd-/': 'toggleComment',
              'Ctrl-/': 'toggleComment',
              'Ctrl-Q': function (cm) {
                cm.foldCode(cm.getCursor());
              }
            },
            lineNumbers: false,
            foldGutter: true,
            viewportMargin: Infinity,
            gutters: ["CodeMirror-foldgutter"]

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
            'fogbugz'
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

    bootstrap = function bootstrap() {

      /**
       * @description Retrieves CSS at URL <code>href</code> and adds to the <head>
       * @param {string} href URL of CSS to get
       */
      var getCSS = function getCSS(href) {
          $('<link/>', {
            rel: 'stylesheet',
            type: 'text/css',
            href: href
          }).appendTo('head');
        },
        storedTheme = localStorage[NAMESPACE + '.THEME_URL'];

      if (storedTheme) {
        getCSS(storedTheme);
      }

      console.info("BugMonkey Markdown: I'm fit to get my party on");

      $(setup);
    };

  bootstrap();

})(jQuery, window);


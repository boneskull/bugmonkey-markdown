(function ($, window) {
  'use strict';

  try {

    var DEBUG = false,
      debug = DEBUG || window.localStorage.BUGMONKEY_MARKDOWN_DEBUG ?
              function debug(msg) {
                console.debug('BugMonkey Markdown [DEBUG]: ' + msg);
              } : $.noop;

    /**
     * @description Global variables
     * @type {Object}
     * @namespace globals
     */
    var globals = (function () {
      var globals = this;
      this.NAMESPACE = 'BugMonkey.Markdown';
      this.NS_CLICK = 'click.' + this.NAMESPACE;
      this.NS_SUBMIT = 'submit.' + this.NAMESPACE;
      this.THEME_URL_KEY = this.NAMESPACE + '.THEME_URL';
      this.THEME_NAME_KEY = this.NAMESPACE + '.THEME_NAME';
      this.editModes = {
        EDIT_AJAX: 1,
        EDIT_FORM: 2,
        EVENT_EDIT_AJAX: 3,
        EVENT_EDIT_FORM: 4
      };
      this.selectors = {
        SEL_CONTAINER: '#bugviewContainer',
        SEL_TEXTAREA: 'textarea',
        SEL_ACTIONBTNS: '.actionButton2[value!="Cancel"]'
      };
      this.defaultEditorOptions = {
        mode: 'gfm', // Github Flavored Markdown
        lineWrapping: true,
        theme: localStorage[globals.THEME_NAME_KEY] || 'default',
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
        gutters: ["CodeMirror-foldgutter"],
        leaveSubmitMethodAlone: true
      };
      return this;
    }).call({});

    /**
     * @description Utility functions
     * @namespace util
     * @type {Object}
     */
    var util = {
      /**
       * @description Loads a CSS file by way of appending a <link> to the <head>.
       * @param url URL of CSS file
       */
      getCSS: function getCSS(url) {
        $('<link/>', {
          rel: 'stylesheet',
          type: 'text/css',
          href: url
        }).appendTo('head');
      },

      /**
       * @description Determines how to handle submission of the edit.
       * There are 4 (?) possibilities:
       *  1.  Case edit over Ajax (typical edit)
       *  2.  Case edit over form submission (new case, edit w file attachment)
       *  3.  Case event edit over Ajax (event edit)
       *  4.  Case event edit form submission (event edit w/ file attachment)
       */
      detectMode: function detectMode() {
        var SEL_COMMAND = 'input[name="command"][value!=""]',
          SEL_FILE = 'input[type=file]',
          $command = $(SEL_COMMAND),
          modes = globals.editModes,
          mode;

        switch ($command.val()) {
          case 'edit':
          case 'editClosed':
          case 'new':
          case 'resolve':
          case 'reopen':
            mode = $(SEL_FILE).val() ? modes.EDIT_FORM :
                   modes.EDIT_AJAX;
            break;
          case 'close':
            mode = modes.EDIT_FORM;
            break;
          default:
        }

        if (mode) {
          debug('detected mode ' + mode);
        } else {
          debug('not in editing mode');
        }
        return mode;
      }
    };


    var userOptions = {};

    var submissionHandlers = (function () {
      var handlers = {},
        SubmissionHandler,
        EditAjaxSubmissionHandler,
        EditFormSubmissionHandler;

      SubmissionHandler = function SubmissionHandler($o) {
        var name;
        if ($o.length !== 1 || !$o.is('textarea')) {
          throw new Error('jQuery element must contain one (1) textarea node, and one textarea node only');
        }
        this.$o = $o;
        name = $o.attr('name');
        this.$formatter =
          $('<input name="' + name + '_sFormat" id="' + name + '_sFormat" ' +
            'type="hidden" value="html"/>');
        debug(this._name + ' created for textarea with id ' + $o.attr('id'));
      };

      SubmissionHandler.prototype = {
        _name: 'SubmissionHandler',

        createEditor: function createEditor() {
          var $o = this.$o;
          this._editor = window.CodeMirror.fromTextArea($o[0],
            $.extend({}, userOptions, globals.defaultEditorOptions, {
              tabindex: $o.attr('tabindex')
            }));
          this.bindSubmission();
        },
        destroyEditor: function destroyEditor(save) {
          save = !!save;
          this.unbindSubmission();
          if (save && this._editor) {
            this._editor.save();
          }
          $('.CodeMirror').remove();
          delete this._editor;
        },
        submit: function submit() {
          var converter = new window.Showdown.converter({extensions: [
              'fogbugz'
            ]}),
            html,
            value = this._editor.getValue();
          debug('markdown:\n' + value);
          html = converter.makeHtml(value);
          this.$o.val(html);
          debug('html:\n' + this.$o.val());
        },
        bindSubmission: function bindSubmission() {
          debug(this._name + ' binding submission event');
        },
        unbindSubmission: function unbindSubmission() {
          debug(this._name + ' unbinding submission event');
        }
      };

      EditAjaxSubmissionHandler = function EditAjaxSubmissionHandler() {
        this._name = 'EditAjaxSubmissionHandler';
        SubmissionHandler.apply(this, arguments);
      };

      EditAjaxSubmissionHandler.prototype =
        Object.create(SubmissionHandler.prototype);

      EditAjaxSubmissionHandler.prototype.bindSubmission =
        function bindSubmission() {
          var SEL_ACTIONBTNS = globals.selectors.SEL_ACTIONBTNS;
          SubmissionHandler.prototype.bindSubmission.apply(this, arguments);
          $(SEL_ACTIONBTNS).preempt({
            attr: 'onclick',
            event: globals.NS_CLICK,
            before: $.proxy(this, 'submit')
          });
          $(this.$o[0].form).append(this.$formatter);
        };
      EditAjaxSubmissionHandler.prototype.unbindSubmission =
        function unbindSubmission() {
          var SEL_ACTIONBTNS = globals.selectors.SEL_ACTIONBTNS;
          $(SEL_ACTIONBTNS).preempt({
            attr: 'onclick',
            event: globals.NS_CLICK,
            restore: true
          });
          this.$formatter.remove();
        };
      EditAjaxSubmissionHandler.mode = globals.editModes.EDIT_AJAX;

      EditFormSubmissionHandler = function EditFormSubmissionHandler() {
        this._name = 'EditFormSubmissionHandler';
        SubmissionHandler.apply(this, arguments);
      };

      EditFormSubmissionHandler.prototype =
        Object.create(SubmissionHandler.prototype);

      EditFormSubmissionHandler.prototype.bindSubmission =
        function bindSubmission() {
          var form = this.$o[0].form;
          SubmissionHandler.prototype.bindSubmission.apply(this, arguments);
          if (form) {
            $(form).on(globals.NS_SUBMIT, $.proxy(this, 'submit'));
          }
        };
      EditFormSubmissionHandler.prototype.unbindSubmission =
        function unbindSubmission() {
          var form = this.$o[0].form;
          SubmissionHandler.prototype.unbindSubmission.apply(this, arguments);
          if (form) {
            $(form).off(globals.NS_SUBMIT);
          }
        };
      EditFormSubmissionHandler.mode = globals.editModes.EDIT_FORM;

      [
        EditAjaxSubmissionHandler, EditFormSubmissionHandler
      ].forEach(function (handler) {
          handlers[handler.mode] = handler;
        });
      return handlers;
    })();

    var bootstrap = function bootstrap() {

      var storedThemeUrl = localStorage[globals.THEME_URL_KEY],
        handlers = {},
        $textarea,
        $container = $(globals.selectors.SEL_CONTAINER),
        mode = util.detectMode(),
        lastMode = mode,

        addHandler = function addHandler(node) {
          var handler;
          if (handlers[node.id]) {
            debug('handler already exists for node with id ' + node.id);
          }
          handler = submissionHandlers[mode];
          if (handler) {
            handlers[node.id] = new submissionHandlers[mode]($(node));
            toggleHandler(node);
          }
        },
        removeHandler = function removeHandler(node) {
          if (handlers[node.id]) {
            handlers[node.id].destroyEditor();
            delete handlers[node.id];
          }
        },
        toggleHandler = function toggleHandler(node) {
          var $node = $(node);
          if ($node.hasClass('richtextarea') && handlers[node.id]) {
            handlers[node.id].destroyEditor(true);
          } else {
            handlers[node.id].createEditor();
          }
        },
        isTextarea = function isTextarea(node) {
          return $(node).is('textarea');
        };

      if (storedThemeUrl) {
        util.getCSS(storedThemeUrl);
      }

      console.info("BugMonkey Markdown: I'm fit to get my party on");

      $textarea = $container.find('textarea');
      if ($textarea.length) {
        addHandler($textarea[0]);
      }

      $container.mutationSummary('connect',
        function (summaries) {
          mode = util.detectMode();

          summaries.forEach(function (summary) {
            var added = summary.added,
              removed = summary.removed,
              klass = summary.attributeChanged ?
                      summary.attributeChanged.class : [];

            if (added.length) {
              added.filter(isTextarea).forEach(addHandler);
            }
            if (removed.length) {
              removed.filter(isTextarea).forEach(removeHandler);
            }
            if (klass.length) {
              klass.filter(isTextarea).forEach(toggleHandler);
            }
          });

          if (mode !== lastMode) {

          }
        },
        [
          {
            element: 'textarea',
            elementAttributes: 'class'
          },
          {
            element: 'input[type=file]'
          }
        ]);

    };

    bootstrap();

  }
  catch
    (e) {
    console.error('BugMonkey Markdown: encountered terrible error');
    console.error(e.stack);
  }
})
(jQuery, window);
//
//        bindEventEditors = function bindEventEditors() {
//          $(SEL_EDIT_EVENT_BTN).each(function () {
//            var $bugevent = $(this).parents(SEL_BUGEVENT),
//              id = $bugevent.attr('id').substring(9),
//              observer =
//                new MutationObserver(function mutationIterator(mutations) {
//                  mutations.forEach(containerMutationHandlerProxy('#BugEventTextArea' +
//                    id));
//                });
//            observer.observe($bugevent[0], {
//              childList: true
//            });
//            $('#TextSaveEditEvent' + id).off('click');
//          });
//        };


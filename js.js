var SEL_OK = '#Button_OKEdit',
  SEL_EDIT = '#sEventEdit',
  SEL_PLAIN_BTN = '.virtualLink:eq(0)',
  SEL_RTE_BTN = '.virtualLink:eq(1)',
  MARKDOWN_API_URL = 'https://api.github.com/markdown',
  $NEW_OK = $(
    '<input class="actionButton2 dlgButton" style="text-align: center" id="Button_OKEdit" name="OK" value="OK"/>'
  ),
  $FORMBUGEDIT,
  cm_editor,
  setup = function setup() {

    $FORMBUGEDIT = $('#formBugEdit');

    if (!$FORMBUGEDIT.length) {
      console.warn('BugMonkey Markdown: not on a bug page');
      return;
    }

    $(SEL_PLAIN_BTN).waitUntilExists(watchEditors, true);
  },
  watchEditors = function watchEditors() {
    var $OK = $(SEL_OK),
      $EDIT = $(SEL_EDIT),
      bind = function bind() {
        if ($OK.is(':visible')) {
          $OK.after($NEW_OK);
          $OK.detach();

          $NEW_OK.click(getMarkdown);

          $EDIT.keydown(function (evt) {
            if (evt.which === 13 && (evt.metaKey || evt.ctrlKey)) {
              getMarkdown();
            }
          });

          $EDIT.keypress(function (evt) {
            if (evt.which === 96) {
              return false;
            }
          });

          cm_editor = window.CodeMirror.fromTextArea($EDIT[0], {
            mode: 'gfm',
          })

          console.log('BugMonkey Markdown: bound events');
        } else {
          console.warn('BugMonkey Markdown: already attached');
        }
      },
      unbind = function unbind() {
        $NEW_OK.after($OK);
        $NEW_OK.remove();
        console.log('BugMonkey Markdown: unbound events (cannot use in RTE)');
      };

    if ($EDIT.is(':visible')) {
      bind();
    }

    $(SEL_RTE_BTN).click(unbind);
    $(SEL_PLAIN_BTN).click(bind);

  },
  br2nl = function br2nl(str) {
    return str.replace(/<br\s*\/?>/mg, '\n');
  },
  getCSS = function getCSS(href) {
    $('<link/>', {
      rel: 'stylesheet',
      type: 'text/css',
      href: href
    }).appendTo('head');
  },
  getMarkdown = function getMarkdown() {
    var $EDIT = $(SEL_EDIT),
      contents;

    cm_editor.save();
    contents = $EDIT.val();

    if (window.CKEDITOR.instances.length) {
      console.warn('BugMonkey Markdown: not available in rich text editor');
      return;
    }

    // refuse to submit an empty edit
    if (!$.trim(contents)) {
      alert('Please enter some text.');
      return false;
    }

    $.post(MARKDOWN_API_URL, JSON.stringify({
      text: contents,
      mode: 'gfm'
    }))
      .done(function (html) {
        var t;
        $EDIT.val(html); // clear, because we're going to copy the HTML
        // $(SEL_RTE_BTN).trigger('click');
        // t = setInterval(function () {
        //   var ckeditor = window.CKEDITOR.instances.sEventEdit;
        //   if (ckeditor) {
        //     clearInterval(t);
        //     ckeditor.loadSnapshot(html);
        //     ckeditor.updateElement();
        $(SEL_OK).trigger('click');
        // $FORMBUGEDIT.submit();
        // }
        // }, 100);

      });
    return false;
  };

// these are asynchronous but there's no real way to know when CSS is "loaded", so just get them.
getCSS(
  '//cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/theme/xq-light.min.css');
getCSS(
  '//cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/codemirror.min.css');

// we need codemirror.js first, and then mode(s) second, in any order.
$.getScript(
  '//cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/codemirror.min.js')
  .then(function () {
    return $.when.apply($, [$.getScript(
      '//cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/mode/markdown/markdown.min.js'
    ), $.getScript(
      '//cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/mode/gfm/gfm.min.js'
    ), $.getScript(
      '//cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/addon/mode/overlay.min.js'
    ), $.getScript(
      '//cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/mode/xml/xml.min.js'
    ), $.getScript(
      '//cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/mode/javascript/javascript.min.js'
    ), $.getScript(
      '//cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/mode/python/python.min.js'
    ), $.getScript(
      '//cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/mode/shell/shell.min.js'
    )]);
  })
  .then(function () {
    // only once we have all our resources are we ready
    console.log('BugMonkey Markdown: external resources gathered');
    $(setup);
  })
  .fail(function (err) {
    console.error('BugMonkey Markdown: ' + err);
  });

// BEGIN THIRD-PARTY PLUGIN(S) 

// jquery.waituntilexists.js: https://gist.github.com/PizzaBrandon/5709010
;
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
        }, 500);
      }
    }

    return $this;
  };

}(jQuery, window));

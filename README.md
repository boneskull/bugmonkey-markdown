# BugMonkey Markdown

BugMonkey customization for FogBugz which allows for Markdown in editor.

*BONUS:* Syntax highlighting in cases for events edited with this customization.

## Prerequisites

BugMonkey Markdown (as of v1.0.4) works in [any browser](http://caniuse.com/mutationobserver) that supports the [MutationObserver API](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver).  That means no IE older than IE11.  I'll get on that...

## Installation

1.  Create a new Customization in FogBugz.
2.  Paste the contents of `dist/bugmonkey-markdown.min.txt` into the customizations editor.
3.  Save, refresh, and you should be ready to go.

## Debugging

Paste `dist/bugmonkey-markdown.txt` into the editor instead.

## Development

You might want to do this if you hate the CSS I picked, or want some other fancy CodeMirror feature.

1.  Execute `npm install`
2.  Execute `bower install`
3.  Make edits to any/all of the following:
  1.  `fogbugz-bugmonkey-markdown.js`
  2.  `fogbugz-bugmonkey-markdown.css`
  3.  `header.txt`
4.  Execute `grunt` to output `bugmonkey-markdown.txt` and `bugmonkey-markdown.min.txt` into the `dist/` directory.
5.  Alternatively, execute `grunt watch` before you start fiddling with files and the distribution `.txt` files will be created automatically.
6.  Paste the output back into FogBugz.  Save, refresh, rinse, repeat.

### Dependencies

BugMonkey Markdown leverages [Showdown](https://github.com/coreyti/showdown), [highlight.js](http://highlightjs.org/), [CodeMirror](http://codemirror.net/) and [jquery.preempt](http://boneskull.github.io/jquery.preempt) to do its dirty work.

### Dev Dependencies

Standard "contrib" tools from [Grunt](http://gruntjs.org), plus [grunt-filetransform](https://github.com/dfernandez79/grunt-filetransform) to glue the pieces together into the FogBugz customization format.

## License

MIT

## Author
[Christopher Hiller](http://boneskull.github.io)


# BugMonkey Markdown

[BugMonkey](https://help.fogcreek.com/7585/customizing-your-fogbugz-site-with-bugmonkey) customization for FogBugz which allows for [Markdown](https://daringfireball.net/projects/markdown/) in case editor.

## Installation

1.  Create a new Customization in FogBugz.
2.  Paste the contents of `dist/bugmonkey-markdown.min.txt` into the customizations editor.
3.  Enable the Customization for yourself.
4.  Save, refresh, and you should be ready to go.

## Usage

Here's an example of altering the CodeMirror CSS:

```js
localStorage['BugMonkey.Markdown.THEME_URL'] = '//cdnjs.cloudflare.com/ajax/libs/codemirror/3.21.0/theme/solarized.min.css';
localStorage['BugMonkey.Markdown.THEME_NAME'] = 'solarized';
```

Now, next time you refresh, you will use this custom theme.

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

BugMonkey Markdown leverages [Showdown](https://github.com/coreyti/showdown), [CodeMirror](http://codemirror.net/) and [jquery.preempt](http://boneskull.github.io/jquery.preempt) to do its dirty work.

IE9 and IE10 support courtesy [Mutation Observers Polyfill](https://github.com/Polymer/MutationObservers).

### Dev Dependencies

Standard "contrib" tools from [Grunt](http://gruntjs.org), plus [grunt-filetransform](https://github.com/dfernandez79/grunt-filetransform) to glue the pieces together into the FogBugz customization format.

## License

MIT, with portions Copyright (c) 2012 The Polymer Authors. All rights reserved.

## Author
[Christopher Hiller](http://boneskull.github.io)


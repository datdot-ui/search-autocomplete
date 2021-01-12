(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
(function (__filename){(function (){
const bel = require('bel')
const csjs = require('csjs-inject')
const path = require('path')
const filename = path.basename(__filename)
const autocomplete = require('..')
const domlog = require('ui-domlog')

function demoComponent () {
    let recipients = []
    let result = fetchData('./src/data.json')
    // show logs
    const terminal = bel`<div class=${css.terminal}></div>`
    const searchBox = autocomplete({page: 'PLANS', flow: 'search', name: 'swarm key', data: result }, protocol('swarmkey'))
    // container
    const container = wrap(searchBox, terminal)
    return container

    function wrap (content, terminal) {
        const container = bel`
        <div class=${css.wrap}>
            <section class=${css.container}>
                ${content}
            </section>
            ${terminal}
        </div>
        `
        return container
    }

    function renderPublish (message) {
        showLog({...message, filename, line: 31})
    }

    function protocol (name) {
        return send => {
            recipients[name] = send
            return receive
        }
    }

    function receive (message) {
        const { page, from, flow, type, action, body } = message
        // console.log(`DEMO <= ${page}/${from} ${type}` );
        showLog(message)
        if (type === 'init') return showLog({page, from, flow, type: 'ready', body, filename, line: 45})
        if (type === 'clear search') return 
        if (type === 'publish') return renderPublish(message)
    }

    // keep the scroll on bottom when the log displayed on the terminal
    function showLog (message) { 
        sendMessage(message)
        .then( log => {
            terminal.append(log)
            terminal.scrollTop = terminal.scrollHeight
        }
    )}

    async function fetchData (path) {
        const response = await fetch(path)  
        if ( response.ok ) return response.json().then(data => data)
        if ( response.status === 404 ) {
            sendMessage({page: 'demo', from: 'data', flow: 'getData', type: 'error', body: `GET ${response.url} 404 (not found)`, filename, line: 63})
            .then( log => terminal.append(log) )
            // throw new Error(`Failed load file from ${response.url}`)
        }
    }

    async function sendMessage (message) {
        return await new Promise( (resolve, reject) => {
            if (message === undefined) reject('no message import')
            const log = domlog(message)
            return resolve(log)
        }).catch( err => { 
            throw new Error(err.message) 
        })
    }
}

const css = csjs`
html {
    font-size: 62.5%;
    box-sizing: border-box;
    height: 100%;
}
*, *::before, *::after {
    box-sizing: inherit;
}
body {
    margin: 0;
    padding: 0;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 100%;
    background-color: rgba(0, 0, 0, .1);
    height: 100%;
}
.wrap {
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 75% 25%;
    height: 100%;
}
.container {
    width: 80%;
    max-width: 98%;
    margin: 20px auto 0 auto;
}
.terminal {
    background-color: #212121;
    color: #f2f2f2;
    font-size: 13px;
    overflow-y: auto;
}
`

document.body.append( demoComponent() )
}).call(this)}).call(this,"/demo/demo.js")
},{"..":32,"bel":3,"csjs-inject":6,"path":29,"ui-domlog":31}],2:[function(require,module,exports){
var trailingNewlineRegex = /\n[\s]+$/
var leadingNewlineRegex = /^\n[\s]+/
var trailingSpaceRegex = /[\s]+$/
var leadingSpaceRegex = /^[\s]+/
var multiSpaceRegex = /[\n\s]+/g

var TEXT_TAGS = [
  'a', 'abbr', 'b', 'bdi', 'bdo', 'br', 'cite', 'data', 'dfn', 'em', 'i',
  'kbd', 'mark', 'q', 'rp', 'rt', 'rtc', 'ruby', 's', 'amp', 'small', 'span',
  'strong', 'sub', 'sup', 'time', 'u', 'var', 'wbr'
]

var VERBATIM_TAGS = [
  'code', 'pre', 'textarea'
]

module.exports = function appendChild (el, childs) {
  if (!Array.isArray(childs)) return

  var nodeName = el.nodeName.toLowerCase()

  var hadText = false
  var value, leader

  for (var i = 0, len = childs.length; i < len; i++) {
    var node = childs[i]
    if (Array.isArray(node)) {
      appendChild(el, node)
      continue
    }

    if (typeof node === 'number' ||
      typeof node === 'boolean' ||
      typeof node === 'function' ||
      node instanceof Date ||
      node instanceof RegExp) {
      node = node.toString()
    }

    var lastChild = el.childNodes[el.childNodes.length - 1]

    // Iterate over text nodes
    if (typeof node === 'string') {
      hadText = true

      // If we already had text, append to the existing text
      if (lastChild && lastChild.nodeName === '#text') {
        lastChild.nodeValue += node

      // We didn't have a text node yet, create one
      } else {
        node = document.createTextNode(node)
        el.appendChild(node)
        lastChild = node
      }

      // If this is the last of the child nodes, make sure we close it out
      // right
      if (i === len - 1) {
        hadText = false
        // Trim the child text nodes if the current node isn't a
        // node where whitespace matters.
        if (TEXT_TAGS.indexOf(nodeName) === -1 &&
          VERBATIM_TAGS.indexOf(nodeName) === -1) {
          value = lastChild.nodeValue
            .replace(leadingNewlineRegex, '')
            .replace(trailingSpaceRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')
          if (value === '') {
            el.removeChild(lastChild)
          } else {
            lastChild.nodeValue = value
          }
        } else if (VERBATIM_TAGS.indexOf(nodeName) === -1) {
          // The very first node in the list should not have leading
          // whitespace. Sibling text nodes should have whitespace if there
          // was any.
          leader = i === 0 ? '' : ' '
          value = lastChild.nodeValue
            .replace(leadingNewlineRegex, leader)
            .replace(leadingSpaceRegex, ' ')
            .replace(trailingSpaceRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')
          lastChild.nodeValue = value
        }
      }

    // Iterate over DOM nodes
    } else if (node && node.nodeType) {
      // If the last node was a text node, make sure it is properly closed out
      if (hadText) {
        hadText = false

        // Trim the child text nodes if the current node isn't a
        // text node or a code node
        if (TEXT_TAGS.indexOf(nodeName) === -1 &&
          VERBATIM_TAGS.indexOf(nodeName) === -1) {
          value = lastChild.nodeValue
            .replace(leadingNewlineRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')

          // Remove empty text nodes, append otherwise
          if (value === '') {
            el.removeChild(lastChild)
          } else {
            lastChild.nodeValue = value
          }
        // Trim the child nodes if the current node is not a node
        // where all whitespace must be preserved
        } else if (VERBATIM_TAGS.indexOf(nodeName) === -1) {
          value = lastChild.nodeValue
            .replace(leadingSpaceRegex, ' ')
            .replace(leadingNewlineRegex, '')
            .replace(trailingNewlineRegex, '')
            .replace(multiSpaceRegex, ' ')
          lastChild.nodeValue = value
        }
      }

      // Store the last nodename
      var _nodeName = node.nodeName
      if (_nodeName) nodeName = _nodeName.toLowerCase()

      // Append the node to the DOM
      el.appendChild(node)
    }
  }
}

},{}],3:[function(require,module,exports){
var hyperx = require('hyperx')
var appendChild = require('./appendChild')

var SVGNS = 'http://www.w3.org/2000/svg'
var XLINKNS = 'http://www.w3.org/1999/xlink'

var BOOL_PROPS = [
  'autofocus', 'checked', 'defaultchecked', 'disabled', 'formnovalidate',
  'indeterminate', 'readonly', 'required', 'selected', 'willvalidate'
]

var COMMENT_TAG = '!--'

var SVG_TAGS = [
  'svg', 'altGlyph', 'altGlyphDef', 'altGlyphItem', 'animate', 'animateColor',
  'animateMotion', 'animateTransform', 'circle', 'clipPath', 'color-profile',
  'cursor', 'defs', 'desc', 'ellipse', 'feBlend', 'feColorMatrix',
  'feComponentTransfer', 'feComposite', 'feConvolveMatrix',
  'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight', 'feFlood',
  'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage',
  'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight',
  'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence', 'filter',
  'font', 'font-face', 'font-face-format', 'font-face-name', 'font-face-src',
  'font-face-uri', 'foreignObject', 'g', 'glyph', 'glyphRef', 'hkern', 'image',
  'line', 'linearGradient', 'marker', 'mask', 'metadata', 'missing-glyph',
  'mpath', 'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect',
  'set', 'stop', 'switch', 'symbol', 'text', 'textPath', 'title', 'tref',
  'tspan', 'use', 'view', 'vkern'
]

function belCreateElement (tag, props, children) {
  var el

  // If an svg tag, it needs a namespace
  if (SVG_TAGS.indexOf(tag) !== -1) {
    props.namespace = SVGNS
  }

  // If we are using a namespace
  var ns = false
  if (props.namespace) {
    ns = props.namespace
    delete props.namespace
  }

  // Create the element
  if (ns) {
    el = document.createElementNS(ns, tag)
  } else if (tag === COMMENT_TAG) {
    return document.createComment(props.comment)
  } else {
    el = document.createElement(tag)
  }

  // Create the properties
  for (var p in props) {
    if (props.hasOwnProperty(p)) {
      var key = p.toLowerCase()
      var val = props[p]
      // Normalize className
      if (key === 'classname') {
        key = 'class'
        p = 'class'
      }
      // The for attribute gets transformed to htmlFor, but we just set as for
      if (p === 'htmlFor') {
        p = 'for'
      }
      // If a property is boolean, set itself to the key
      if (BOOL_PROPS.indexOf(key) !== -1) {
        if (val === 'true') val = key
        else if (val === 'false') continue
      }
      // If a property prefers being set directly vs setAttribute
      if (key.slice(0, 2) === 'on') {
        el[p] = val
      } else {
        if (ns) {
          if (p === 'xlink:href') {
            el.setAttributeNS(XLINKNS, p, val)
          } else if (/^xmlns($|:)/i.test(p)) {
            // skip xmlns definitions
          } else {
            el.setAttributeNS(null, p, val)
          }
        } else {
          el.setAttribute(p, val)
        }
      }
    }
  }

  appendChild(el, children)
  return el
}

module.exports = hyperx(belCreateElement, {comments: true})
module.exports.default = module.exports
module.exports.createElement = belCreateElement

},{"./appendChild":2,"hyperx":27}],4:[function(require,module,exports){
(function (global){(function (){
'use strict';

var csjs = require('csjs');
var insertCss = require('insert-css');

function csjsInserter() {
  var args = Array.prototype.slice.call(arguments);
  var result = csjs.apply(null, args);
  if (global.document) {
    insertCss(csjs.getCss(result));
  }
  return result;
}

module.exports = csjsInserter;

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"csjs":9,"insert-css":28}],5:[function(require,module,exports){
'use strict';

module.exports = require('csjs/get-css');

},{"csjs/get-css":8}],6:[function(require,module,exports){
'use strict';

var csjs = require('./csjs');

module.exports = csjs;
module.exports.csjs = csjs;
module.exports.getCss = require('./get-css');

},{"./csjs":4,"./get-css":5}],7:[function(require,module,exports){
'use strict';

module.exports = require('./lib/csjs');

},{"./lib/csjs":13}],8:[function(require,module,exports){
'use strict';

module.exports = require('./lib/get-css');

},{"./lib/get-css":17}],9:[function(require,module,exports){
'use strict';

var csjs = require('./csjs');

module.exports = csjs();
module.exports.csjs = csjs;
module.exports.noScope = csjs({ noscope: true });
module.exports.getCss = require('./get-css');

},{"./csjs":7,"./get-css":8}],10:[function(require,module,exports){
'use strict';

/**
 * base62 encode implementation based on base62 module:
 * https://github.com/andrew/base62.js
 */

var CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

module.exports = function encode(integer) {
  if (integer === 0) {
    return '0';
  }
  var str = '';
  while (integer > 0) {
    str = CHARS[integer % 62] + str;
    integer = Math.floor(integer / 62);
  }
  return str;
};

},{}],11:[function(require,module,exports){
'use strict';

var makeComposition = require('./composition').makeComposition;

module.exports = function createExports(classes, keyframes, compositions) {
  var keyframesObj = Object.keys(keyframes).reduce(function(acc, key) {
    var val = keyframes[key];
    acc[val] = makeComposition([key], [val], true);
    return acc;
  }, {});

  var exports = Object.keys(classes).reduce(function(acc, key) {
    var val = classes[key];
    var composition = compositions[key];
    var extended = composition ? getClassChain(composition) : [];
    var allClasses = [key].concat(extended);
    var unscoped = allClasses.map(function(name) {
      return classes[name] ? classes[name] : name;
    });
    acc[val] = makeComposition(allClasses, unscoped);
    return acc;
  }, keyframesObj);

  return exports;
}

function getClassChain(obj) {
  var visited = {}, acc = [];

  function traverse(obj) {
    return Object.keys(obj).forEach(function(key) {
      if (!visited[key]) {
        visited[key] = true;
        acc.push(key);
        traverse(obj[key]);
      }
    });
  }

  traverse(obj);
  return acc;
}

},{"./composition":12}],12:[function(require,module,exports){
'use strict';

module.exports = {
  makeComposition: makeComposition,
  isComposition: isComposition,
  ignoreComposition: ignoreComposition
};

/**
 * Returns an immutable composition object containing the given class names
 * @param  {array} classNames - The input array of class names
 * @return {Composition}      - An immutable object that holds multiple
 *                              representations of the class composition
 */
function makeComposition(classNames, unscoped, isAnimation) {
  var classString = classNames.join(' ');
  return Object.create(Composition.prototype, {
    classNames: { // the original array of class names
      value: Object.freeze(classNames),
      configurable: false,
      writable: false,
      enumerable: true
    },
    unscoped: { // the original array of class names
      value: Object.freeze(unscoped),
      configurable: false,
      writable: false,
      enumerable: true
    },
    className: { // space-separated class string for use in HTML
      value: classString,
      configurable: false,
      writable: false,
      enumerable: true
    },
    selector: { // comma-separated, period-prefixed string for use in CSS
      value: classNames.map(function(name) {
        return isAnimation ? name : '.' + name;
      }).join(', '),
      configurable: false,
      writable: false,
      enumerable: true
    },
    toString: { // toString() method, returns class string for use in HTML
      value: function() {
        return classString;
      },
      configurable: false,
      writeable: false,
      enumerable: false
    }
  });
}

/**
 * Returns whether the input value is a Composition
 * @param value      - value to check
 * @return {boolean} - whether value is a Composition or not
 */
function isComposition(value) {
  return value instanceof Composition;
}

function ignoreComposition(values) {
  return values.reduce(function(acc, val) {
    if (isComposition(val)) {
      val.classNames.forEach(function(name, i) {
        acc[name] = val.unscoped[i];
      });
    }
    return acc;
  }, {});
}

/**
 * Private constructor for use in `instanceof` checks
 */
function Composition() {}

},{}],13:[function(require,module,exports){
'use strict';

var extractExtends = require('./css-extract-extends');
var composition = require('./composition');
var isComposition = composition.isComposition;
var ignoreComposition = composition.ignoreComposition;
var buildExports = require('./build-exports');
var scopify = require('./scopeify');
var cssKey = require('./css-key');
var extractExports = require('./extract-exports');

module.exports = function csjsTemplate(opts) {
  opts = (typeof opts === 'undefined') ? {} : opts;
  var noscope = (typeof opts.noscope === 'undefined') ? false : opts.noscope;

  return function csjsHandler(strings, values) {
    // Fast path to prevent arguments deopt
    var values = Array(arguments.length - 1);
    for (var i = 1; i < arguments.length; i++) {
      values[i - 1] = arguments[i];
    }
    var css = joiner(strings, values.map(selectorize));
    var ignores = ignoreComposition(values);

    var scope = noscope ? extractExports(css) : scopify(css, ignores);
    var extracted = extractExtends(scope.css);
    var localClasses = without(scope.classes, ignores);
    var localKeyframes = without(scope.keyframes, ignores);
    var compositions = extracted.compositions;

    var exports = buildExports(localClasses, localKeyframes, compositions);

    return Object.defineProperty(exports, cssKey, {
      enumerable: false,
      configurable: false,
      writeable: false,
      value: extracted.css
    });
  }
}

/**
 * Replaces class compositions with comma seperated class selectors
 * @param  value - the potential class composition
 * @return       - the original value or the selectorized class composition
 */
function selectorize(value) {
  return isComposition(value) ? value.selector : value;
}

/**
 * Joins template string literals and values
 * @param  {array} strings - array of strings
 * @param  {array} values  - array of values
 * @return {string}        - strings and values joined
 */
function joiner(strings, values) {
  return strings.map(function(str, i) {
    return (i !== values.length) ? str + values[i] : str;
  }).join('');
}

/**
 * Returns first object without keys of second
 * @param  {object} obj      - source object
 * @param  {object} unwanted - object with unwanted keys
 * @return {object}          - first object without unwanted keys
 */
function without(obj, unwanted) {
  return Object.keys(obj).reduce(function(acc, key) {
    if (!unwanted[key]) {
      acc[key] = obj[key];
    }
    return acc;
  }, {});
}

},{"./build-exports":11,"./composition":12,"./css-extract-extends":14,"./css-key":15,"./extract-exports":16,"./scopeify":22}],14:[function(require,module,exports){
'use strict';

var makeComposition = require('./composition').makeComposition;

var regex = /\.([^\s]+)(\s+)(extends\s+)(\.[^{]+)/g;

module.exports = function extractExtends(css) {
  var found, matches = [];
  while (found = regex.exec(css)) {
    matches.unshift(found);
  }

  function extractCompositions(acc, match) {
    var extendee = getClassName(match[1]);
    var keyword = match[3];
    var extended = match[4];

    // remove from output css
    var index = match.index + match[1].length + match[2].length;
    var len = keyword.length + extended.length;
    acc.css = acc.css.slice(0, index) + " " + acc.css.slice(index + len + 1);

    var extendedClasses = splitter(extended);

    extendedClasses.forEach(function(className) {
      if (!acc.compositions[extendee]) {
        acc.compositions[extendee] = {};
      }
      if (!acc.compositions[className]) {
        acc.compositions[className] = {};
      }
      acc.compositions[extendee][className] = acc.compositions[className];
    });
    return acc;
  }

  return matches.reduce(extractCompositions, {
    css: css,
    compositions: {}
  });

};

function splitter(match) {
  return match.split(',').map(getClassName);
}

function getClassName(str) {
  var trimmed = str.trim();
  return trimmed[0] === '.' ? trimmed.substr(1) : trimmed;
}

},{"./composition":12}],15:[function(require,module,exports){
'use strict';

/**
 * CSS identifiers with whitespace are invalid
 * Hence this key will not cause a collision
 */

module.exports = ' css ';

},{}],16:[function(require,module,exports){
'use strict';

var regex = require('./regex');
var classRegex = regex.classRegex;
var keyframesRegex = regex.keyframesRegex;

module.exports = extractExports;

function extractExports(css) {
  return {
    css: css,
    keyframes: getExport(css, keyframesRegex),
    classes: getExport(css, classRegex)
  };
}

function getExport(css, regex) {
  var prop = {};
  var match;
  while((match = regex.exec(css)) !== null) {
    var name = match[2];
    prop[name] = name;
  }
  return prop;
}

},{"./regex":19}],17:[function(require,module,exports){
'use strict';

var cssKey = require('./css-key');

module.exports = function getCss(csjs) {
  return csjs[cssKey];
};

},{"./css-key":15}],18:[function(require,module,exports){
'use strict';

/**
 * djb2 string hash implementation based on string-hash module:
 * https://github.com/darkskyapp/string-hash
 */

module.exports = function hashStr(str) {
  var hash = 5381;
  var i = str.length;

  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i)
  }
  return hash >>> 0;
};

},{}],19:[function(require,module,exports){
'use strict';

var findClasses = /(\.)(?!\d)([^\s\.,{\[>+~#:)]*)(?![^{]*})/.source;
var findKeyframes = /(@\S*keyframes\s*)([^{\s]*)/.source;
var ignoreComments = /(?!(?:[^*/]|\*[^/]|\/[^*])*\*+\/)/.source;

var classRegex = new RegExp(findClasses + ignoreComments, 'g');
var keyframesRegex = new RegExp(findKeyframes + ignoreComments, 'g');

module.exports = {
  classRegex: classRegex,
  keyframesRegex: keyframesRegex,
  ignoreComments: ignoreComments,
};

},{}],20:[function(require,module,exports){
var ignoreComments = require('./regex').ignoreComments;

module.exports = replaceAnimations;

function replaceAnimations(result) {
  var animations = Object.keys(result.keyframes).reduce(function(acc, key) {
    acc[result.keyframes[key]] = key;
    return acc;
  }, {});
  var unscoped = Object.keys(animations);

  if (unscoped.length) {
    var regexStr = '((?:animation|animation-name)\\s*:[^};]*)('
      + unscoped.join('|') + ')([;\\s])' + ignoreComments;
    var regex = new RegExp(regexStr, 'g');

    var replaced = result.css.replace(regex, function(match, preamble, name, ending) {
      return preamble + animations[name] + ending;
    });

    return {
      css: replaced,
      keyframes: result.keyframes,
      classes: result.classes
    }
  }

  return result;
}

},{"./regex":19}],21:[function(require,module,exports){
'use strict';

var encode = require('./base62-encode');
var hash = require('./hash-string');

module.exports = function fileScoper(fileSrc) {
  var suffix = encode(hash(fileSrc));

  return function scopedName(name) {
    return name + '_' + suffix;
  }
};

},{"./base62-encode":10,"./hash-string":18}],22:[function(require,module,exports){
'use strict';

var fileScoper = require('./scoped-name');
var replaceAnimations = require('./replace-animations');
var regex = require('./regex');
var classRegex = regex.classRegex;
var keyframesRegex = regex.keyframesRegex;

module.exports = scopify;

function scopify(css, ignores) {
  var makeScopedName = fileScoper(css);
  var replacers = {
    classes: classRegex,
    keyframes: keyframesRegex
  };

  function scopeCss(result, key) {
    var replacer = replacers[key];
    function replaceFn(fullMatch, prefix, name) {
      var scopedName = ignores[name] ? name : makeScopedName(name);
      result[key][scopedName] = name;
      return prefix + scopedName;
    }
    return {
      css: result.css.replace(replacer, replaceFn),
      keyframes: result.keyframes,
      classes: result.classes
    };
  }

  var result = Object.keys(replacers).reduce(scopeCss, {
    css: css,
    keyframes: {},
    classes: {}
  });

  return replaceAnimations(result);
}

},{"./regex":19,"./replace-animations":20,"./scoped-name":21}],23:[function(require,module,exports){
(function (__filename){(function (){
const bel = require('bel')
const csjs = require('csjs-inject')
const path = require('path')
const filename = path.basename(__filename)

module.exports = button

function button ({page, flow = null, name, content, style, color, custom, current, disabled = false}, protocol) {
    const widget = 'ui-button'
    const send2Parent = protocol( receive )
    send2Parent({page, from: name, flow: flow ? `${flow}/${widget}` : widget, type: 'init', filename, line: 11})
    let state
    
    let button = bel`<button role="button" class="${css.btn} ${ checkStyle() } ${color ? css[color] : ''} ${custom ? custom.join(' ') : ''} ${current ? css.current : '' }" name=${name} aria-label=${name} disabled=${disabled}>${content}</button>`
    button.onclick = click

    return button

    function checkStyle() {
        let arr = []
        if (Array.isArray(style)) {
            for (let i = 0; i < style.length; i++) {
                arr.push(css[style[i]])
            }
            return arr.join(' ')
        } 
        return css[style]
    }
    
    function click(e) {
        let x = e.clientX - e.target.offsetLeft
        let y = e.clientY - e.target.offsetTop
        let ripple = document.createElement('span')
        ripple.classList.add(css.ripple)
        ripple.style.left = `${x}px`
        ripple.style.top = `${y}px`

        button.append(ripple)
        setTimeout( () => { ripple.remove() }, 600)
        send2Parent({page, from: name, flow: flow ? `${flow}/${widget}` : widget, type: 'click', filename, line: 40})
    }

    function setState(update) {
        return state = update
    }

    function toggleActive (boolean, message) {
        const { page, from, flow } = message
        if (boolean) {
            let newState = setState('self-active')
            send2Parent({page, flow, from, type: 'state', body: newState, filename, line: 51})
            button.classList.add(css.active)
        } else {
            let newState = setState('remove-active')
            send2Parent({page, flow, from, type: 'state', body: newState, filename, line: 55})
            button.classList.remove(css.active)
        }
        
    }

    function receive(message) {
        const { type } = message
        // console.log('received from main component', message )
        if ( type === 'current-active' ) button.classList.add(css.current)
        if ( type === 'disabled' ) button.setAttribute('disabled', true)
        if ( type === 'active' ) toggleActive(true, message)
        if ( type === 'remove-active' ) toggleActive(false, message)
    }
}


const css = csjs`
.btn {
    position: relative;
    border: none;
    background: transparent;
    padding: 15px 20px;
    font-size: 14px;
    cursor: pointer;
    outline: none;
    overflow: hidden;
    transition: background-color .3s, border .3s, color .3s ease-in-out;
}
.btn svg g {
    transition: fill .3s linear;
}
.solid {
    color: #fff;
    font-weight: bold;
    border-radius: 8px;
}
.solid:hover {
    background-color: rgba(0, 0, 0, .8);
}
.solid [class^="icon"] path {
    stroke: #fff;
}
.outlined {
    border-radius: 8px;
}
.circle-solid {
    border-radius: 100%;
}
.circle-solid:hover {
    border-radius: 100%;
    background-color: #333;
}
.default {
    border-radius: 8px;
    background-color: transparent;
}
.fill-grey svg g {
    fill: #BBBBBB;
}
.fill-grey:hover {
    background-color: rgba(0, 0, 0, .75);
}
.fill-grey:hover svg g {
    fill: #fff;
}
.fill-dark svg g {
    fill: #333;
}
.fill-dark:hover {
    background-color: rgba(255,255,255, .5);
}
.fill-white svg g {
    fill: #fff;
}
.fill-white:hover {
    background-color: rgba(188,188,188, .5);
}
.stroke-black path {
    stroke: #000;
}
.stroke-grey path {
    stroke: #BBB;
}
.link {}
.link:hover {
    color: rgba(0, 0, 0, .6);
}
.link-black {
    color: #000;
}
.link-white {
    color: #fff;
}
.link-blue {
    color: #4BAFFF;
}
.link-blue:hover {
    color: #008af9;
}
.link-grey {
    color: #707070;
}
.link-grey:hover {
    color: #333;
}
.link-cancel {
    color: #9A9A9A;
}
.link.cancel:hover {
    background-color: transparent;
}
.ripple {
    position: absolute;
    border-radius: 50%;
    background-color: #fff;
    transform: translate(-50%, -50%);
    pointer-events: none;
    -webkit-animation: ripples .6s linear infinite;
    animation: ripples .6s linear infinite;
}
.transparent {
    background-color: transparent;
}
.black {
    color: #fff;
    background-color: #000;
}
.dark {
    color: #fff;
    background-color: #333;
}
.grey {
    color: #fff;
    background-color: #9A9A9A;
}
.white {
    color: #707070;
    background-color: #fff;
}
.white:hover {
    color: #fff;
    background-color: #d3d3d3;
}
.list {
    color: #707070;
    background-color: #DDD;
}
.list.current {
    color: #fff;
    background-color: #333;
}
.list:hover {
    color: #fff;
}
.light-grey {
    color: #fff;
    background-color: #BBBBBB;
}
.border-grey {
    color: #707070;
    border: 1px solid #707070;
}
.border-grey:hover {
    color: rgba(143, 143, 143, 1);
    border-color: rgba(143, 143, 143, .15);
    background-color: rgba(143, 143, 143, .15);
}
.border-white {
    color: #fff;
    border: 1px solid #fff;
}
.border-white:hover {
    background-color: rgba(255, 255, 255, .5);
}
svg {
    width: 100%;
    height: auto;
}
.circle-solid [class^="icon"] path {
    stroke: #fff;
}
.small {
    width: 30px;
    height: 30px;
    padding: 0;
}
.small [class^='icon'] {
    display: inline-block;
    padding-top: 2px;
}
.btn[disabled], .btn[disabled]:hover {
    color: #fff;
    background-color: rgba(217, 217, 217, 1);
    cursor: not-allowed;
}
.btn[disabled].default {
    background-color: transparent;
}
.btn[disabled].default:hover g {
    fill: #BBB;
}
.btn[disabled].default path {
    stroke: #BBB;
}
.current {}
.nav {
    padding: 0;
    line-height: 40px;
}
.nav.current {
    color: #242424;
    font-weight: bold;
    background-color: #F2F2F2;
}
.option {
    border: 2px solid rgba(255,255,255,0);
    border-radius: 18px;
    transition: border .6s, color .5s ease-in-out;
}
.option.current {
    font-size: 16px;
    font-weight: bold;
    color: #000;
    border: 2px solid rgba(0,0,0,1);
}
.active {
    color: #fff;
    background-color: #000;
}
@keyframes ripples {
    0% {
        width: 0px;
        height: 0px;
        opacity: .5;
    }
    100% {
        width: 500px;
        height: 500px;
        opacity: 0;
    }
}
`
}).call(this)}).call(this,"/node_modules/datdot-ui-button/src/index.js")
},{"bel":3,"csjs-inject":6,"path":29}],24:[function(require,module,exports){
(function (__filename){(function (){
const bel = require('bel')
const csjs = require('csjs-inject')
const button = require('datdot-ui-button')
const svg = require('datdot-ui-graphic')
const path = require('path')
const filename = path.basename(__filename)

module.exports = filterOption

function filterOption ({page, flow, name, data}, protocol) {
    const widget = 'ui-filter-option'
    const send2Parent = protocol( receive )
    send2Parent({page, from: name, flow: flow ? `${flow}/${widget}` : widget, type: 'init', filename, line: 13})
    let recipients = []
    // icon
    const iconOption = svg( { css: `${css.icon} ${css['icon-option']}`, path: 'assets/option.svg' })
    // button
    const filterOption = button({page, flow: flow ? `${flow}/${widget}` : widget,  name: 'filter-option', content: iconOption, style: 'default', color: 'fill-grey'}, optionProtocol('filter-option'))
    const optionAction = bel`<div class="${css.action} ${css.option}">${filterOption}</div>`
    // filter option
    const optionList = bel`<ul class="${css['option-list']}" onclick=${(e) => actionOptionList(e)}></ul>`
    // get lits
    optionListRender(data).then( buttons => {
        buttons.map( (item, i) => { 
            const li = bel`<li>${item}</li>`
            // need to set an id to button for toggle using, because Safari cannot compare body or from (string issue)
            item.setAttribute('id', i+1)
            optionList.append(li) 
        })
        return buttons
    })

    // ! use window.onload is not worked
    document.addEventListener('DOMContentloaded', triggerOptionInactive())

    return optionAction

    /*************************
    * ------- Actions --------
    *************************/
    function triggerOptionInactive () {
        document.body.addEventListener('click', (event) => {
            const target = event.target
            // * if target is same as filterOption, then keep optionList opening
            if (target === filterOption) return
            // * find css name first of filterOption button
            let style = [...filterOption.classList].filter( className => className.includes('active'))
            // if class name condition is true
            if (filterOption.classList.contains(style)) {
                // * remove optionList when add css.hide
                // ! cannot use function to repeat using, because it's loaded from document.body
                // ! cannot read page, flow, name properties
                optionList.classList.add(css.hide)
                setTimeout( () => optionList.remove(), 500)
                /* 
                * filter-option button needs to send 'remove-active' for 
                * main component and button component to check recipients[from].state 
                * and remove active status 
                */
                recipients[name]({page, from: name, flow: flow ? `${flow}/${widget}` : widget, type: 'remove-active', filename, line: 60})
                return send2Parent({page, from: name, flow: flow ? `${flow}/${widget}` : widget, type: 'remove-active', filename, line: 61})
            }
        })
    }

    function actionOptionList (event) {
        event.stopPropagation()
        const target = event.target
        const classList = [...target.classList]
        const listStyle = classList.filter( style => style.includes('btn'))
        if (!target.classList.contains(listStyle)) return
        // for recipients[name] using
        const id = target.id
        // if icon is not contained css.hide then do toggling it on unchecked/checked 
        const type = target.classList.contains(css.checked) ? 'unchecked' : 'checked'
        target.classList.toggle(css.checked)
        const message = {page: 'demo', from: String(target.innerText), flow: `${flow}/option-list`, type, body: Number(id), filename, line: 77}
        return send2Parent(message)
    }

    function displayOptionList (message) {
        const {page, from, flow, type, body, action} = message
        let log = {page, from, flow, type: 'active', body, filename, line: 83}
        recipients[from](log)
        optionAction.append(optionList)
        if (optionList.children.length > 0) optionList.classList.remove(css.hide)
        return send2Parent(log)
    }

    function hideOptionList (message) {
        const {page, from, flow, type, body, action} = message
        let log = {page, from, flow, type, body, filename, line: 92}
        recipients[from](log)
        optionList.classList.add(css.hide)
        // remove optionList when add css.hide
        optionList.classList.add(css.hide)
        setTimeout( () => optionList.remove(), 500)
        return send2Parent(log)
    }

    function actionFilterOption (message) {
        const { type } = message
        if (type === 'self-active') displayOptionList(message)
        if (type === 'remove-active') hideOptionList(message)
    }

    /*************************
    * ------- Protocol --------
    *************************/
    function optionProtocol (name) {
        return send => {
            recipients[name] = send
            return receive
        }
    }

    /*************************
    * ------ Receivers -------
    *************************/
    function receive (message) {
        const {page, flow, from, type, action, body} = message
        if (type === 'click') {}
        if ( from === 'filter-option') actionFilterOption(message)
        return send2Parent(message)
    }

    /*********************************
    * ------ Promise() Element -------
    *********************************/
    async function optionListRender (data) {
        return await new Promise((resolve, reject) => {
            if (data === undefined) reject( )
            const lists = data.map( item => {
                let style
                const check = svg( { css: `${css.icon} ${css['icon-check']}`, path: 'assets/check.svg' })
                const circle = bel`<span class=${css.circle}></span>`
                if (item.status === 'Available') style = css.on
                if (item.status === 'Not available')  style = css.off
                if (item.status === 'Hypercore') style = css.core
                if (item.status === 'Hyperdrive') style = css.drive
                if (item.status === 'Cabal') style = css.cabal
                circle.classList.add(style)
                const content = bel`<div class=${css.status}>${check}${circle}${item.status}</div>`
                const btn = button({page, flow: flow ? `${flow}/${widget}` : widget, name: item.status, content, style: 'link', color: 'link-white', custom: item.active ? [css.checked] : ''}, optionProtocol(`${item.status}`))
                return btn
            })
            return resolve(lists)
        }).catch( err => { throw new Error(err)} )
    }
}

const css = csjs`
.option {
    position: relative;
    display: grid;
    justify-items: right;
}
.option > button[class^="btn"] {
    position: relative;
    z-index: 3;
    margin-right: 0;
}
.option-list {
    position: absolute;
    z-index: 2;
    right: 0;
    width: 160px;
    animation: showup .25s linear forwards;
}
.option-list, .option-list li  { 
    margin: 0; 
    padding: 0;
    list-style: none;
}
.option-list li > button {
    background-color: #000;
    margin: 0;
    padding: 0;
    width: 100%;
    text-align: left;
    transition: background-color 0.3s linear;
}
.option-list li:first-child > button {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
}
.option-list li:last-child > button {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
}
.option-list li > button:hover {
    color: #fff;
    background-color: #666;
}
.option-list li > button .icon-check {
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.3s linear;
}
.option-list .icon-check svg path {
    stroke: #fff;
}
.option-list li > button.checked .icon-check {
    opacity: 1;
}
.status {
    display: grid;
    grid-template-rows: 32px;
    grid-template-columns: 18px 27px auto;
    padding: 0 10px;
    align-items: center;
    pointer-events: none;
}
.circle {
    display: block;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: #000;
    justify-self: center;
    pointer-events: none;
}
.on {
    background-color: #109B36;
}
.off {
    background-color: #d9d9d9;
}
.core {
    background-color: #BCE0FD;
}
.drive {
    background-color: #FFDFA2;
}
.cabal {
    background-color: #E9D3FD;
}
.icon {
    width: 16px;
    pointer-events: none;
}
.icon-check {}
.icon-option {}
.hide {
    animation: disappear .25s linear forwards;
}
@media screen and (max-width: 503px) {
    .option button {
        background-color: rgba(0, 0, 0, .15);
    }
    .option button[class*='active'] {
        background-color: rgba(0, 0, 0, 1);
    }
    .option button svg g {
        fill: rgba(255,255,255, 1);
    }
}
@keyframes showup {
    0% {
        opacity: 0;
        top: 45px;
    }
    100% {
        opacity: 1;
        top: 53px;
    }
}
@keyframes disappear {
    0% {
        opacity: 1;
        top: 53px;
    }
    100% {
        opacity: 0;
        top: 45px;
    }
}
`
}).call(this)}).call(this,"/node_modules/datdot-ui-filter-option/src/index.js")
},{"bel":3,"csjs-inject":6,"datdot-ui-button":23,"datdot-ui-graphic":25,"path":29}],25:[function(require,module,exports){
module.exports = svg

function svg(opts) {
    var { css = null, path }  = opts
    
    const el = document.createElement('div')
    
    async function load(done) {
        const res = await fetch(path)
        const parse = document.createElement('div')

        if (res.status == 200) {
            let graphic = await res.text()
            parse.innerHTML = graphic
            return done(null, parse.children[0])
        }
        throw new Error(res.status)
    }

    load((err, svg) => {
        if (err) console.error(err)
        if (css) el.className = css
        el.append(svg)
    })
    
    return el
}   
},{}],26:[function(require,module,exports){
module.exports = attributeToProperty

var transform = {
  'class': 'className',
  'for': 'htmlFor',
  'http-equiv': 'httpEquiv'
}

function attributeToProperty (h) {
  return function (tagName, attrs, children) {
    for (var attr in attrs) {
      if (attr in transform) {
        attrs[transform[attr]] = attrs[attr]
        delete attrs[attr]
      }
    }
    return h(tagName, attrs, children)
  }
}

},{}],27:[function(require,module,exports){
var attrToProp = require('hyperscript-attribute-to-property')

var VAR = 0, TEXT = 1, OPEN = 2, CLOSE = 3, ATTR = 4
var ATTR_KEY = 5, ATTR_KEY_W = 6
var ATTR_VALUE_W = 7, ATTR_VALUE = 8
var ATTR_VALUE_SQ = 9, ATTR_VALUE_DQ = 10
var ATTR_EQ = 11, ATTR_BREAK = 12
var COMMENT = 13

module.exports = function (h, opts) {
  if (!opts) opts = {}
  var concat = opts.concat || function (a, b) {
    return String(a) + String(b)
  }
  if (opts.attrToProp !== false) {
    h = attrToProp(h)
  }

  return function (strings) {
    var state = TEXT, reg = ''
    var arglen = arguments.length
    var parts = []

    for (var i = 0; i < strings.length; i++) {
      if (i < arglen - 1) {
        var arg = arguments[i+1]
        var p = parse(strings[i])
        var xstate = state
        if (xstate === ATTR_VALUE_DQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_SQ) xstate = ATTR_VALUE
        if (xstate === ATTR_VALUE_W) xstate = ATTR_VALUE
        if (xstate === ATTR) xstate = ATTR_KEY
        if (xstate === OPEN) {
          if (reg === '/') {
            p.push([ OPEN, '/', arg ])
            reg = ''
          } else {
            p.push([ OPEN, arg ])
          }
        } else if (xstate === COMMENT && opts.comments) {
          reg += String(arg)
        } else if (xstate !== COMMENT) {
          p.push([ VAR, xstate, arg ])
        }
        parts.push.apply(parts, p)
      } else parts.push.apply(parts, parse(strings[i]))
    }

    var tree = [null,{},[]]
    var stack = [[tree,-1]]
    for (var i = 0; i < parts.length; i++) {
      var cur = stack[stack.length-1][0]
      var p = parts[i], s = p[0]
      if (s === OPEN && /^\//.test(p[1])) {
        var ix = stack[stack.length-1][1]
        if (stack.length > 1) {
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === OPEN) {
        var c = [p[1],{},[]]
        cur[2].push(c)
        stack.push([c,cur[2].length-1])
      } else if (s === ATTR_KEY || (s === VAR && p[1] === ATTR_KEY)) {
        var key = ''
        var copyKey
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_KEY) {
            key = concat(key, parts[i][1])
          } else if (parts[i][0] === VAR && parts[i][1] === ATTR_KEY) {
            if (typeof parts[i][2] === 'object' && !key) {
              for (copyKey in parts[i][2]) {
                if (parts[i][2].hasOwnProperty(copyKey) && !cur[1][copyKey]) {
                  cur[1][copyKey] = parts[i][2][copyKey]
                }
              }
            } else {
              key = concat(key, parts[i][2])
            }
          } else break
        }
        if (parts[i][0] === ATTR_EQ) i++
        var j = i
        for (; i < parts.length; i++) {
          if (parts[i][0] === ATTR_VALUE || parts[i][0] === ATTR_KEY) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][1])
            else parts[i][1]==="" || (cur[1][key] = concat(cur[1][key], parts[i][1]));
          } else if (parts[i][0] === VAR
          && (parts[i][1] === ATTR_VALUE || parts[i][1] === ATTR_KEY)) {
            if (!cur[1][key]) cur[1][key] = strfn(parts[i][2])
            else parts[i][2]==="" || (cur[1][key] = concat(cur[1][key], parts[i][2]));
          } else {
            if (key.length && !cur[1][key] && i === j
            && (parts[i][0] === CLOSE || parts[i][0] === ATTR_BREAK)) {
              // https://html.spec.whatwg.org/multipage/infrastructure.html#boolean-attributes
              // empty string is falsy, not well behaved value in browser
              cur[1][key] = key.toLowerCase()
            }
            if (parts[i][0] === CLOSE) {
              i--
            }
            break
          }
        }
      } else if (s === ATTR_KEY) {
        cur[1][p[1]] = true
      } else if (s === VAR && p[1] === ATTR_KEY) {
        cur[1][p[2]] = true
      } else if (s === CLOSE) {
        if (selfClosing(cur[0]) && stack.length) {
          var ix = stack[stack.length-1][1]
          stack.pop()
          stack[stack.length-1][0][2][ix] = h(
            cur[0], cur[1], cur[2].length ? cur[2] : undefined
          )
        }
      } else if (s === VAR && p[1] === TEXT) {
        if (p[2] === undefined || p[2] === null) p[2] = ''
        else if (!p[2]) p[2] = concat('', p[2])
        if (Array.isArray(p[2][0])) {
          cur[2].push.apply(cur[2], p[2])
        } else {
          cur[2].push(p[2])
        }
      } else if (s === TEXT) {
        cur[2].push(p[1])
      } else if (s === ATTR_EQ || s === ATTR_BREAK) {
        // no-op
      } else {
        throw new Error('unhandled: ' + s)
      }
    }

    if (tree[2].length > 1 && /^\s*$/.test(tree[2][0])) {
      tree[2].shift()
    }

    if (tree[2].length > 2
    || (tree[2].length === 2 && /\S/.test(tree[2][1]))) {
      if (opts.createFragment) return opts.createFragment(tree[2])
      throw new Error(
        'multiple root elements must be wrapped in an enclosing tag'
      )
    }
    if (Array.isArray(tree[2][0]) && typeof tree[2][0][0] === 'string'
    && Array.isArray(tree[2][0][2])) {
      tree[2][0] = h(tree[2][0][0], tree[2][0][1], tree[2][0][2])
    }
    return tree[2][0]

    function parse (str) {
      var res = []
      if (state === ATTR_VALUE_W) state = ATTR
      for (var i = 0; i < str.length; i++) {
        var c = str.charAt(i)
        if (state === TEXT && c === '<') {
          if (reg.length) res.push([TEXT, reg])
          reg = ''
          state = OPEN
        } else if (c === '>' && !quot(state) && state !== COMMENT) {
          if (state === OPEN && reg.length) {
            res.push([OPEN,reg])
          } else if (state === ATTR_KEY) {
            res.push([ATTR_KEY,reg])
          } else if (state === ATTR_VALUE && reg.length) {
            res.push([ATTR_VALUE,reg])
          }
          res.push([CLOSE])
          reg = ''
          state = TEXT
        } else if (state === COMMENT && /-$/.test(reg) && c === '-') {
          if (opts.comments) {
            res.push([ATTR_VALUE,reg.substr(0, reg.length - 1)])
          }
          reg = ''
          state = TEXT
        } else if (state === OPEN && /^!--$/.test(reg)) {
          if (opts.comments) {
            res.push([OPEN, reg],[ATTR_KEY,'comment'],[ATTR_EQ])
          }
          reg = c
          state = COMMENT
        } else if (state === TEXT || state === COMMENT) {
          reg += c
        } else if (state === OPEN && c === '/' && reg.length) {
          // no-op, self closing tag without a space <br/>
        } else if (state === OPEN && /\s/.test(c)) {
          if (reg.length) {
            res.push([OPEN, reg])
          }
          reg = ''
          state = ATTR
        } else if (state === OPEN) {
          reg += c
        } else if (state === ATTR && /[^\s"'=/]/.test(c)) {
          state = ATTR_KEY
          reg = c
        } else if (state === ATTR && /\s/.test(c)) {
          if (reg.length) res.push([ATTR_KEY,reg])
          res.push([ATTR_BREAK])
        } else if (state === ATTR_KEY && /\s/.test(c)) {
          res.push([ATTR_KEY,reg])
          reg = ''
          state = ATTR_KEY_W
        } else if (state === ATTR_KEY && c === '=') {
          res.push([ATTR_KEY,reg],[ATTR_EQ])
          reg = ''
          state = ATTR_VALUE_W
        } else if (state === ATTR_KEY) {
          reg += c
        } else if ((state === ATTR_KEY_W || state === ATTR) && c === '=') {
          res.push([ATTR_EQ])
          state = ATTR_VALUE_W
        } else if ((state === ATTR_KEY_W || state === ATTR) && !/\s/.test(c)) {
          res.push([ATTR_BREAK])
          if (/[\w-]/.test(c)) {
            reg += c
            state = ATTR_KEY
          } else state = ATTR
        } else if (state === ATTR_VALUE_W && c === '"') {
          state = ATTR_VALUE_DQ
        } else if (state === ATTR_VALUE_W && c === "'") {
          state = ATTR_VALUE_SQ
        } else if (state === ATTR_VALUE_DQ && c === '"') {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_SQ && c === "'") {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE_W && !/\s/.test(c)) {
          state = ATTR_VALUE
          i--
        } else if (state === ATTR_VALUE && /\s/.test(c)) {
          res.push([ATTR_VALUE,reg],[ATTR_BREAK])
          reg = ''
          state = ATTR
        } else if (state === ATTR_VALUE || state === ATTR_VALUE_SQ
        || state === ATTR_VALUE_DQ) {
          reg += c
        }
      }
      if (state === TEXT && reg.length) {
        res.push([TEXT,reg])
        reg = ''
      } else if (state === ATTR_VALUE && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_DQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_VALUE_SQ && reg.length) {
        res.push([ATTR_VALUE,reg])
        reg = ''
      } else if (state === ATTR_KEY) {
        res.push([ATTR_KEY,reg])
        reg = ''
      }
      return res
    }
  }

  function strfn (x) {
    if (typeof x === 'function') return x
    else if (typeof x === 'string') return x
    else if (x && typeof x === 'object') return x
    else if (x === null || x === undefined) return x
    else return concat('', x)
  }
}

function quot (state) {
  return state === ATTR_VALUE_SQ || state === ATTR_VALUE_DQ
}

var closeRE = RegExp('^(' + [
  'area', 'base', 'basefont', 'bgsound', 'br', 'col', 'command', 'embed',
  'frame', 'hr', 'img', 'input', 'isindex', 'keygen', 'link', 'meta', 'param',
  'source', 'track', 'wbr', '!--',
  // SVG TAGS
  'animate', 'animateTransform', 'circle', 'cursor', 'desc', 'ellipse',
  'feBlend', 'feColorMatrix', 'feComposite',
  'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap',
  'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR',
  'feGaussianBlur', 'feImage', 'feMergeNode', 'feMorphology',
  'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile',
  'feTurbulence', 'font-face-format', 'font-face-name', 'font-face-uri',
  'glyph', 'glyphRef', 'hkern', 'image', 'line', 'missing-glyph', 'mpath',
  'path', 'polygon', 'polyline', 'rect', 'set', 'stop', 'tref', 'use', 'view',
  'vkern'
].join('|') + ')(?:[\.#][a-zA-Z0-9\u007F-\uFFFF_:-]+)*$')
function selfClosing (tag) { return closeRE.test(tag) }

},{"hyperscript-attribute-to-property":26}],28:[function(require,module,exports){
var inserted = {};

module.exports = function (css, options) {
    if (inserted[css]) return;
    inserted[css] = true;
    
    var elem = document.createElement('style');
    elem.setAttribute('type', 'text/css');

    if ('textContent' in elem) {
      elem.textContent = css;
    } else {
      elem.styleSheet.cssText = css;
    }
    
    var head = document.getElementsByTagName('head')[0];
    if (options && options.prepend) {
        head.insertBefore(elem, head.childNodes[0]);
    } else {
        head.appendChild(elem);
    }
};

},{}],29:[function(require,module,exports){
(function (process){(function (){
// .dirname, .basename, and .extname methods are extracted from Node.js v8.11.1,
// backported and transplited with Babel, with backwards-compat fixes

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function (path) {
  if (typeof path !== 'string') path = path + '';
  if (path.length === 0) return '.';
  var code = path.charCodeAt(0);
  var hasRoot = code === 47 /*/*/;
  var end = -1;
  var matchedSlash = true;
  for (var i = path.length - 1; i >= 1; --i) {
    code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
      // We saw the first non-path separator
      matchedSlash = false;
    }
  }

  if (end === -1) return hasRoot ? '/' : '.';
  if (hasRoot && end === 1) {
    // return '//';
    // Backwards-compat fix:
    return '/';
  }
  return path.slice(0, end);
};

function basename(path) {
  if (typeof path !== 'string') path = path + '';

  var start = 0;
  var end = -1;
  var matchedSlash = true;
  var i;

  for (i = path.length - 1; i >= 0; --i) {
    if (path.charCodeAt(i) === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          start = i + 1;
          break;
        }
      } else if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // path component
      matchedSlash = false;
      end = i + 1;
    }
  }

  if (end === -1) return '';
  return path.slice(start, end);
}

// Uses a mixed approach for backwards-compatibility, as ext behavior changed
// in new Node.js versions, so only basename() above is backported here
exports.basename = function (path, ext) {
  var f = basename(path);
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};

exports.extname = function (path) {
  if (typeof path !== 'string') path = path + '';
  var startDot = -1;
  var startPart = 0;
  var end = -1;
  var matchedSlash = true;
  // Track the state of characters (if any) we see before our first dot and
  // after any path separator we find
  var preDotState = 0;
  for (var i = path.length - 1; i >= 0; --i) {
    var code = path.charCodeAt(i);
    if (code === 47 /*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
    if (end === -1) {
      // We saw the first non-path separator, mark this as the end of our
      // extension
      matchedSlash = false;
      end = i + 1;
    }
    if (code === 46 /*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
    } else if (startDot !== -1) {
      // We saw a non-dot and non-path separator before our dot, so we should
      // have a good chance at having a non-empty extension
      preDotState = -1;
    }
  }

  if (startDot === -1 || end === -1 ||
      // We saw a non-dot character immediately before the dot
      preDotState === 0 ||
      // The (right-most) trimmed path component is exactly '..'
      preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
    return '';
  }
  return path.slice(startDot, end);
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this)}).call(this,require('_process'))
},{"_process":30}],30:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],31:[function(require,module,exports){
const bel = require('bel')
const csjs = require('csjs-inject')

module.exports = domlog

let count = 1

function domlog (message) {
    const { page = 'demo', from, flow, type, body, action, filename, line } = message
    const log = bel`
    <div class=${css.log} role="log">
        <div class=${css.badge}>${count}</div>
        <div class="${css.output} ${type === 'error' ? css.error : '' }">
            <span class=${css.page}>${page}</span> 
            <span class=${css.flow}>${flow}</span>
            <span class=${css.from}>${from}</span>
            <span class=${css.type}>${type}</span>
            <span class=${css.info}>${typeof body === 'string' ? body : JSON.stringify(body, ["swarm", "feeds", "links"], 3)}</span>
        </div>
        <div class=${css['code-line']}>${filename}:${line}</div>
    </div>`
    count++
    return log
    
}
const css = csjs`
.log {
    display: grid;
    grid-template-rows: auto;
    grid-template-columns: auto 1fr auto;
    align-items: center;
    padding: 2px 12px 0 0;
    border-bottom: 1px solid #333;
}
.log:last-child, .log:last-child .page, .log:last-child .flow, .log:last-child .type {
    color: #FFF500;
    font-weight: bold;
}
.output {}
.badge {
    background-color: #333;
    padding: 6px;
    margin-right: 10px;
    font-size: 14px;
    display: inline-block;
}
.code-line {}
.error {
    
}
.error .type {
    padding: 2px 6px;
    color: white;
    background-color: #AC0000;
    border-radius: 2px;
}
.error .info {
    color: #FF2626;
}
.page {
    display: inline-block;
    color: rgba(255,255,255,.75);
    background-color: #2A2E30;
    padding: 4px 6px;
    border-radius: 4px;
}
.flow {
    color: #1DA5FF;
}
.from {
    color: #fff;
}
.type {
    color: #FFB14A;
}
.info {}
`
},{"bel":3,"csjs-inject":6}],32:[function(require,module,exports){
(function (__filename){(function (){
const bel = require('bel')
const csjs = require('csjs-inject')
const path = require('path')
const filename = path.basename(__filename)
const button = require('datdot-ui-button')
const svg = require('datdot-ui-graphic')
const searchResult = require('search-result')
const filterOption = require('datdot-ui-filter-option')

module.exports = autocomplete

function autocomplete ({page, flow, name, data}, protocol) {
    // * navigator.platform display: iPad, iPhone, MacIntel ...etc
    // alert(navigator.platform) it is only work for real platform, simulator is only displaying current OS name
    // * navigator.userAgent display: iPhone, iPad, iPod ...etc
    const device =  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'mobile' : 'laptop/desktop'
    const search = bel`<div role="search" class=${css.search} aria-label="search"></div>`
    data.then( args => {
        let arr = []
        arr = [...args]
        return elements(arr)
    })

    return search
    
    function elements (data) {
        const widget = 'ui-autocomplete'
        const send2Parent = protocol( receive )
        let recipients = []
        let optionList = [
            {id: 1, status: "Available", active: true}, 
            {id: 2, status: "Not available", active: true}, 
            {id: 3, status: "Hypercore", active: true},
            {id: 4, status: "Hyperdrive", active: true},
            {id: 5, status: "Cabal", active: true}
        ]
        let val, selectSwarm
        let feeds = data
        const iconClear = svg({css: `${css.icon} ${css['icon-clear']}`, path: 'assets/cancel.svg'})
        const clear = button({page, name: 'clear', content: iconClear, style: ['circle-solid', 'small'], color: 'light-grey', custom: [css.clear]}, clearProtocol('clear'))
        const input = bel`<input type="text" class=${css['search-input']} name=${name} role="search input" aria-label="search input" tabindex=0>`
        const controlForm = bel`<div class=${css['control-form']}>${input}</div>`
        const list = searchResult({page, name: 'swarm', data: feeds}, searchResultProtocol('swarm-key-result'))
        // option dropdown
        const option = filterOption({page, flow, name: 'filter-option', data: optionList}, optionProtocol('filter-option'))
        const action = bel`<aside class=${css.action}>${option}</aside>`

        list.append(action)
        send2Parent({page, from: name, flow: flow ? `${flow}/${widget}` : widget, type: 'init', filename, line: 49 })
        
        input.onfocus = handleFocus
        input.onblur = handleBlur
        input.onchange = handleChange
        input.onkeyup = handleKey

        // display hide list or show list
        document.body.addEventListener('click', (event) => {
            const target = event.target
            // console.log( target.parentNode );
            if (list.classList.contains(css.hide) || target.name === 'create-plan') return
            if (target === input || target.parentNode === option || target === clear)  {
                list.classList.remove(css.hide)
                return list.removeAttribute('disabled')
            }
            list.classList.add(css.hide)
            list.setAttribute('disabled', true)
        })

        return search.append(controlForm, list) 
    
        /*************************
        * ------- Actions --------
        *************************/
        function removeError(element) {
            return element.classList.remove(css.error)
        }

        function inValiadUrl (string) {
            controlForm.classList.add(css.error)
            return send2Parent({page, from: 'search filter', flow: flow ? `${flow}/${widget}` : widget, type: 'error', body: `${string} is a unvalidated URL of swarm key`})
        }

        function isValidUrl (string) {
            const type = string.split('://')[0]
            const reg = /core|drive|cabal/g
            if (type.match(reg)) return true
            return false
        }

        function publish (string) {
            let type = string
            if (string.includes('://')) type = isValidUrl(string)
            if (type) { 
                removeError(controlForm)
            } else { 
                inValiadUrl(string)
            }
            list.classList.add(css.hide)
            recipients['swarm-key-result']({page, from: 'search filter', flow: widget, type: 'publish', body: string })
            return send2Parent({page, from: 'search filter', flow: widget, type: 'publish', body: string, filename, line: 100 })
        }

        function searchFilter (string) {
            optionList.forEach( item => {
                if (item.active) return filterFeeds(feeds, string)
            })
        }

        function filterFeeds(args, string) {
            // filter characters are matched with swarm key
            let searchString = string.toLowerCase()
            let arr = args.filter( item => {
                let swarm = item.swarm.toLowerCase()
                let address = `${item.type}://`
                return address.includes(searchString) || swarm.includes(searchString) || address.includes(searchString.split("://")[0]) && swarm.includes( searchString.split('://')[1] )
            })
            // if not found any match adress, then do publish new swarm, and remove status
            if ( arr.length === 0 ) {
                const statusElement = controlForm.querySelector(`.${css.status}`)
                if (statusElement) { 
                    statusElement.classList.add(css.hide)
                    setTimeout( ()=> { 
                        statusElement.remove()
                        controlForm.classList.remove(css.selected)
                    }, 100)
                }
                controlForm.classList.add(css.publish)
                return publish(string)
            }
            list.classList.remove(css.hide)
            return recipients['swarm-key-result']({page, from: 'search filter', type: 'filter', body: {data: arr, keyword: searchString.includes('://') ? searchString.split('://')[1] : searchString}})
        }

        function statusElementRemove () {
            const statusElement = controlForm.querySelector(`.${css.status}`)
            if (statusElement) {
                statusElement.remove()
                controlForm.classList.remove(css.selected)
                search.append(list)
            }
        }

        // select swarm
        function selectSwarmAction (obj) {
            const { swarm, isValid } = obj
            const type = obj.type === 'hypercore' ? 'core' : obj.type === 'hyperdrive' ? 'drive' : 'cabal'
            const span = bel`<span class="${css.status}${isValid ? ` ${css.isValid}` : '' }">`
            const statusElement = controlForm.querySelector(`.${css.status}`)
            input.value = `${type}://${swarm}`
            selectSwarm = input.value
            // close filter-option
            let filterOption = 'filter-option'
            let state = recipients[filterOption].state
            if (state === 'self-active') { 
                recipients[filterOption].state = 'remove-active'
                recipients[filterOption]({page, from: filterOption, flow: flow ? `${flow}/${widget}`: widget, type: recipients[filterOption].state, filename, line: 156 })
            }
            // remove status
            if (statusElement) statusElement.remove()
            if (controlForm.children[2] === undefined) controlForm.append(clear)
            if (clear.classList.contains(css.hide)) clear.classList.remove(css.hide)
            list.classList.add(css.hide)
            controlForm.classList.add(css.selected)
            controlForm.insertBefore(span, input)
            recipients['swarm-key-result']({page, from: 'feeds list', type: 'selected', body:obj})
            return send2Parent({page, from: 'feeds list', flow: flow ? `${flow}/${widget}` : widget, type: 'selected', body: obj, filename, line: 166 })
        }

        function online(args) {
            return args.filter(obj => obj.feeds.find( feed => feed.match(/https/ig) ) )
        }

        function offline(args) {
            return args.filter(obj => !obj.feeds.find( feed => feed.match(/https/ig) ) )
        }

        function actionToggleCheck (message) {
            const { from, body } = message
            let on, off
            let result = []
            let options = optionList.map( item => { 
                                        // * better to use return item for add more conditions
                                        if (item.id === body ) item.active = !item.active
                                        if (/^Available/.test(item.status) && item.active ) on = online(data)
                                        if (/^Not available/.test(item.status) && item.active ) off = offline(data)
                                        return item
                                    }).map( item => {
                                        if (/core/i.test(item.status) && item.active) {
                                            let arr = data.filter( obj => /core/i.test(obj.type))
                                            console.log('core', arr);
                                            return result.push(...arr)
                                        }
                                        if (/drive/i.test(item.status) && item.active) {
                                            let arr = data.filter( obj => /drive/i.test(obj.type)) 
                                            console.log('drive', arr )
                                            return result.push(...arr)
                                        }
                                        if (/cabal/i.test(item.status) && item.active) {
                                            let arr = data.filter( obj => /cabal/i.test(obj.type))
                                            console.log('cabal', arr )
                                            return result.push(...arr)
                                        }
                                        return item
                                    })

            result.sort( (a, b) => a.id - b.id)

            if (on === undefined && off === undefined) return filterResult(undefined)
            if (on !== undefined && off !== undefined) { 
                if (result !== undefined) return filterResult(result)
                return filterResult(data)
            }
            if (on !== undefined && off === undefined) { 
                if (result !== undefined) on = online(result)
                return filterResult(on)
            }
            if (on === undefined && off !== undefined) {
                if (result !== undefined) off = offline(result)
                return filterResult(off)
            }
            send2Parent({...message, filename, line: 199})
        }

        function filterResult(result) {
            feeds = result
            recipients['swarm-key-result']({page, from: 'filter-option', flow, type: 'filter', body: {data: feeds}})
            return send2Parent({page, from: 'filter-option', flow, type: 'filter', body: feeds ? `${feeds.length} feeds` : `feeds not found`, filename, line: 227 })
        }

        function activeOption (message) {
            const { page, from, flow } = message
            let state = recipients[from].state
            if (state === undefined) recipients[from].state = 'self-active'
            if (state === 'self-active') recipients[from].state = 'remove-active'
            if (state === 'remove-active') recipients[from].state = 'self-active'
            recipients[from]({page, from, flow, type: recipients[from].state, filename, line: 236 })
        }

        function handleClearSearch (name) {
            val = ''
            input.value = val
            optionList.forEach( item => {
                if (item.status === 'Available' && item.active === false && item.status === 'Not available' && item.active === false) return
            })
            clear.remove()
            list.classList.remove(css.hide)
            statusElementRemove()
            removeError(controlForm)
            send2Parent({page, from: name, flow: flow ? `${flow}/${widget}` : widget, type: 'clear search', body: val, filename, line: 249 })
            recipients['swarm-key-result']({page, from: name, flow: flow ? `${flow}/${widget}` : widget, type: 'clear', body: feeds})
        }

        function handleKey (event) {
            const target = event.target
            val = target.value
            if (selectSwarm !== undefined ) {
                if (selectSwarm.includes(val) && target.value.length < selectSwarm.length ) statusElementRemove()
            }
            if (!controlForm.querySelector(`.${css.clear}`)) controlForm.append(clear)
            if (clear.classList.contains(css.hide)) clear.classList.remove(css.hide)
            if (val === '' ) {
                controlForm.removeChild(clear)
                removeError(controlForm)
                statusElementRemove()
            }
            searchFilter(val)
            recipients['swarm-key-result']({page, from: name, flow: flow ? `${flow}/${widget}` : widget, type: 'keyup', body: target.value })
            return send2Parent({page, from: target.name, flow: flow ? `${flow}/${widget}` : widget, type: 'keyup', body: val, filename, line: 268 })
        }

        function handleBlur (event) {
            const target = event.target
            return send2Parent({page, from: target.name, flow: flow ? `${flow}/${widget}` : widget, type: 'blur', body: target.value, filename, line: 273 })
        }

        function handleFocus (event) {
            const target = event.target
            if (list.classList.contains(css.hide)) list.classList.remove(css.hide)
            return send2Parent({page, from: target.name, flow: flow ? `${flow}/${widget}` : widget, type: 'focus', body: target.value, filename, line: 279 })
        }

        function handleChange (event) {
            const target = event.target
            val = target.value
            return send2Parent({page, from: target.name, flow: flow ? `${flow}/${widget}` : widget, type: 'change', body: target.value, filename, line: 285 })
        }

        /*************************
        * ------- Protocol --------
        *************************/
        function searchResultProtocol (name) {
            return send => {
                recipients[name] = send
                return function receiveSearchResult (message) {
                    const { page, from, flow, type, body } = message
                    if (type === 'click') selectSwarmAction(body)
                }
            }
        }

        function optionProtocol (name) {
            return send => {
                recipients[name] = send
                return function receiveOption (message) {
                    const { page, from, flow, type, action, body, filename, line } = message
                    // received message from clear button
                    send2Parent(message)
                    if (type === 'click') {
                        if (from === 'filter-option') return activeOption(message)
                    }
                    // close dropdown menu of filter-option  when document.body clicked
                    if (type === 'remove-active') return recipients[from].state = type
                    if (type === 'unchecked') return actionToggleCheck(message)
                    if (type === 'checked') return actionToggleCheck(message)
                }
            }
        }

        function clearProtocol (name) {
            return send => {
                recipients[name] = send
                return function receiveClear (message) {
                    const { page, from, flow, type, action, body, filename, line } = message
                    // received message from clear button
                    if (type === 'click') handleClearSearch(name)
                }
            }
        }

        function receive (message) {
            const {page, from, type, action, body} = message
            // console.log(`${page} => ${widget} ${type}`);
        }
    }
}


const css = csjs`
.search {
    position: relative;
}
.control-form {
    display: grid;
    grid-template-rows: auto;
    grid-template-columns: 1fr 30px;
    background-color: #fff;
    border-radius: 8px;
    align-items: center;
    padding-left: 10px;
    transition: color 0.15s, background-color 0.15s linear;
}
.selected {
    grid-template-columns: 20px 1fr 30px;
}
.search-input {
    width: 100%;
    font-size: 1.4rem;
    border: none;
    outline: none;
    padding: 14px 0;
    background-color: transparent;
}
.clear {
    transform: scale(0.6);
    animation: showup .15s linear forwards;
}
.hide {
    pointer-events: none;
    animation: disppear .15s linear forwards;
}
.icon {}
.icon-clear {
    pointer-events: none;
}
.status {
    display: inline-block;
    width: 12px;
    height: 12px;
    background-color: #D9D9D9;
    border-radius: 50px;
}
.isValid {
    background-color: #109B36;
}
.action {
    position: absolute;
    right: 5px;
    top: 5px;
}
.icon-option {
    width: 24px;
}
.hide {
    animation: disppear .5s linear forwards;
}
.publish {}
.error {
    background-color: #FFEAE8;
}
@keyframes disppear {
    0% {
        opacity: 1;
        top: 53px;
    }
    100% {
        opacity: 0;
        top: 45px;
    }
}
@keyframes showup {
    0% {
        opacity: 0;
    }
    100% {
        opacity: 1;
    }
}
@keyframes disppear {
    0% {
        opacity: 1;
    }
    100% {
        opacity: 0;
    }
}
@media screen and (max-width: 414px) and (-webkit-min-device-pixel-ratio:0) {
    .control-form button > [class*='clear'] {
        padding: 4px;
    }
}
`
}).call(this)}).call(this,"/src/index.js")
},{"bel":3,"csjs-inject":6,"datdot-ui-button":23,"datdot-ui-filter-option":24,"datdot-ui-graphic":25,"path":29,"search-result":33}],33:[function(require,module,exports){
const bel = require('bel')
const csjs = require('csjs-inject')

module.exports = searchResult

function searchResult ({page, flow = null, name = 'search result', data}, protocol) {
    const widget = 'ui-swarm-list'
    const send2Parent = protocol( receive )
    const ul = bel`<ul role="feeds" class=${css.feeds}></ul>`
    const feedsTotal  = bel`<span class=${css.feedsTotal}></span>`
    const searchFooter = bel`<div class=${css['search-footer']}>${feedsTotal}</div>`
    const content = bel`<div class=${css.content}>${ul}</div>` 
    const element = bel`<div class=${css.result}>${content}${searchFooter}</div>`

    renderList(data)
    send2Parent({page, from: name, flow: flow ? `${flow}/${widget}` : widget, type: 'init'})

    return element

    function click (event, obj) {
        event.stopPropagation()
        return send2Parent({page, from: name, flow: flow ? `${flow}/${widget}` : widget, type: 'click', body: obj})
    }

    function renderList (args) {
        ul.innerHTML = ''
        disabled(false)
        list(args)
    }

    function filterList ({data, keyword}) {
        ul.innerHTML = ''
        disabled(false)
        return list(data, keyword)
    }

    function list (args, keyword) {
        let len = args == void 0 ? `feeds not found` : `${args.length} feeds` 
        feedsTotal.innerText = len
        if (args === undefined) return
        return args.map( obj => {     
            const type = obj.type === 'hypercore' ? 'core' : obj.type === 'hyperdrive' ? 'drive' : 'cabal'
            let li = bel`
            <li role=${obj.type} arial-label="${obj.swarm}" onclick=${ (event) => click(event, {...obj, isValid: isValidFeeds(obj.feeds)}) }>
                <span class="${css.status}${isValidFeeds(obj.feeds) ? ` ${css.isValid}` : ''}"></span>
                <span class="${css.badge} ${css[type]}">${type}</span>
                <span class=${css.feed}>${highlight(keyword, obj.swarm)}</span>
            </li>`
            ul.append(li)
            content.append(ul)
        })
    }

    function highlight (string, swarm) {
        if (string === undefined || !swarm.toLowerCase().includes(string)) return swarm
        const matchStart = swarm.toLowerCase().indexOf(string)
        const matchEnd = matchStart + string.length - 1
        const beforeMatch = swarm.slice(0, matchStart)
        const matchLetter = swarm.slice(matchStart, matchEnd + 1)
        const afterMatch = swarm.slice(matchEnd+1)
        return bel`<span>${beforeMatch}<span class=${css.highlight}>${matchLetter}</span>${afterMatch}</span>`
    }

    function disabled (boolean) {
        if (boolean) element.setAttribute('disabled', true)
        else element.setAttribute('disabled', false)
    }

    // TODO: wait to make a isValid feed
    function isValidFeeds (feeds) {
        return feeds.some( feed => feed.match(/https/ig) )
    }

    function receive (message) {
        const { page, flow, from, type, action, body} = message
        if (type === 'clear') renderList(body)
        if (type === 'filter') filterList(body)
        if (type === 'publish') disabled(true)
        if (type === 'selected') disabled(true)
    }
}

const css = csjs`
.result {
    position: absolute;
    width: 100%;
    height: 360px;
    z-index: 9;
    left: 0;
    margin-top: 5px;
    display: grid;
    grid-template-rows: 1fr 27px;
    grid-template-columns: auto; 
    border-radius: 8px;
    background-color: #fff;
}
.result[disabled=true] {
    pointer-events: none;
}
.content {
    overflow-x: hidden;
    overflow-y: auto;
}
.search-footer {
    font-size: 12px;
    line-height: 27px;
    text-align: right;
    color: #fff;
    background-color: #4B4B4B;
    padding: 0 10px;
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
}
.feeds {
    margin: 10px 0 0 0;
    padding: 0;
}
.feeds li {
    display: grid;
    grid-template-rows: 1fr;
    grid-template-columns: 20px 52px auto;
    align-items: center;
    padding: 8px 10px;
    font-size: 1.4rem;
    cursor: pointer;
    transition: background-color 0.45s ease-in-out;
}
.feeds li:hover {
    background-color: #F5F5F5;
}
.status {
    display: inline-block;
    width: 12px;
    height: 12px;
    background-color: #D9D9D9;
    border-radius: 50px;
    margin-right: 10px;
}
.isValid {
    background-color: #109B36;
}
.badge {
    border-radius: 10px;
    padding: 2px 8px;
    text-align: center;
    margin-right: 5px;
    max-height: 20px;
}
.core {
    background-color: #BCE0FD;
}
.drive {
    background-color: #FFDFA2;
}
.cabal {
    background-color: #E9D3FF;
}
.feed {
    overflow-wrap: break-word;
    word-break: break-all;
    line-height: 20px;
}
.hide {
    display: none;
}
.highlight {
    background-color: #FFEEAF;
}
@media screen and (max-width: 503px) {
    .feeds li {
        padding: 6px 10px;
        align-items: flex-start;
    }
    .status {
        margin-top: 5px;
    }
}
`
},{"bel":3,"csjs-inject":6}]},{},[1]);

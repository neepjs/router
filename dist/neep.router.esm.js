/*!
 * NeepRouter v0.1.0-alpha.3
 * (c) 2020 Fierflame
 * @license MIT
 */
import { mSimple, mName } from '@neep/core';

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
}

let value;
let encase;
let register;
let Error;
let Deliver;
let label;
let createElement;
let addContextConstructor;
function installNeep(Neep) {
  ({
    value,
    encase,
    register,
    Error,
    Deliver,
    label,
    createElement,
    addContextConstructor
  } = Neep);
}

function contextConstructor(context) {
  const router = context.delivered.__NeepRouter__;
  const depth = context.delivered.__RouteDepth__ || 0;
  Reflect.defineProperty(context, 'route', {
    value: router,
    enumerable: true,
    configurable: true
  });
  Reflect.defineProperty(context, 'match', {
    get: () => router === null || router === void 0 ? void 0 : router._get(depth),
    enumerable: true,
    configurable: true
  });
}
function installContextConstructor() {
  addContextConstructor(contextConstructor);
}

function RouterView(props, {
  delivered
}) {
  const isNew = props.router instanceof Router;
  const router = isNew ? props.router : delivered.__NeepRouter__;

  if (!(router instanceof Router)) {
    return;
  }

  let depth = props.depth;

  if (typeof depth === 'number' && Number.isInteger(depth)) {
    if (depth < 0) {
      depth = router.size - depth;
    }
  } else {
    depth = isNew ? 0 : (delivered.__RouteDepth__ || 0) + 1;
  }

  if (depth < 0) {
    return null;
  }

  const match = router._get(depth);

  if (!match) {
    return;
  }

  const {
    route: {
      components
    }
  } = match;

  if (!components) {
    return null;
  }

  const name = props.name || 'default';
  const component = name in components ? components[name] : undefined;

  if (!component) {
    return null;
  }

  label(`[path=${match.path}]`, '#987654');
  return createElement(Deliver, {
    __RouteDepth__: depth,
    __NeepRouter__: router
  }, createElement(component, props));
}
mSimple(RouterView);
mName('RouterView', RouterView);

function RouterLink(props, context) {
  var _route$history;

  const {
    route,
    childNodes
  } = context;

  if (!route) {
    return createElement('template', {}, ...childNodes);
  }

  let {
    to,
    append,
    replace,
    path,
    search,
    hash,
    query,
    alias,
    params
  } = props;

  if (!to) {
    to = {
      path,
      search,
      hash,
      query,
      alias,
      params
    };
  } else if (typeof to === 'string') {
    to = {
      path: to
    };
  }

  if (append) {
    to.append = true;
  }

  function onclick() {
    if (!route || !to) {
      return;
    }

    if (replace) {
      route.replace(to);
    } else {
      route.push(to);
    }
  }

  return ((_route$history = route.history) === null || _route$history === void 0 ? void 0 : _route$history.link({ ...props,
    to
  }, context, onclick)) || createElement('span', {
    '@click': onclick
  }, ...childNodes);
}
mSimple(RouterLink);
mName('RouterLink', RouterLink);

function installComponents() {
  register('RouterView', RouterView);
  register('router-view', RouterView);
  register('RouterLink', RouterLink);
  register('router-link', RouterLink);
}

function install(Neep) {
  installNeep(Neep);
  installComponents();
  installContextConstructor();
}

function cleanPath(path) {
  path = `/${path}`.replace(/\/+(\/|$)/g, '$1');

  while (/[^/]+\/\.{2,}(\/|$)/.test(path)) {
    path = path.replace(/\/[^/]+\/\.(\.+(?:\/|$))/g, '/$1');
  }

  path = path.replace(/\/\.+(\/|$)/g, '$1');
  return path || '/';
}

/**
 * Tokenize input string.
 */
function lexer(str) {
  var tokens = [];
  var i = 0;

  while (i < str.length) {
    var char = str[i];

    if (char === "*" || char === "+" || char === "?") {
      tokens.push({
        type: "MODIFIER",
        index: i,
        value: str[i++]
      });
      continue;
    }

    if (char === "\\") {
      tokens.push({
        type: "ESCAPED_CHAR",
        index: i++,
        value: str[i++]
      });
      continue;
    }

    if (char === "{") {
      tokens.push({
        type: "OPEN",
        index: i,
        value: str[i++]
      });
      continue;
    }

    if (char === "}") {
      tokens.push({
        type: "CLOSE",
        index: i,
        value: str[i++]
      });
      continue;
    }

    if (char === ":") {
      var name = "";
      var j = i + 1;

      while (j < str.length) {
        var code = str.charCodeAt(j);

        if ( // `0-9`
        code >= 48 && code <= 57 || // `A-Z`
        code >= 65 && code <= 90 || // `a-z`
        code >= 97 && code <= 122 || // `_`
        code === 95) {
          name += str[j++];
          continue;
        }

        break;
      }

      if (!name) throw new TypeError("Missing parameter name at " + i);
      tokens.push({
        type: "NAME",
        index: i,
        value: name
      });
      i = j;
      continue;
    }

    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;

      if (str[j] === "?") {
        throw new TypeError("Pattern cannot start with \"?\" at " + j);
      }

      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }

        if (str[j] === ")") {
          count--;

          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;

          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at " + j);
          }
        }

        pattern += str[j++];
      }

      if (count) throw new TypeError("Unbalanced pattern at " + i);
      if (!pattern) throw new TypeError("Missing pattern at " + i);
      tokens.push({
        type: "PATTERN",
        index: i,
        value: pattern
      });
      i = j;
      continue;
    }

    tokens.push({
      type: "CHAR",
      index: i,
      value: str[i++]
    });
  }

  tokens.push({
    type: "END",
    index: i,
    value: ""
  });
  return tokens;
}
/**
 * Parse a string for the raw tokens.
 */


function parse(str, options) {
  if (options === void 0) {
    options = {};
  }

  var tokens = lexer(str);
  var _a = options.prefixes,
      prefixes = _a === void 0 ? "./" : _a;
  var defaultPattern = "[^" + escapeString(options.delimiter || "/#?") + "]+?";
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";

  var tryConsume = function (type) {
    if (i < tokens.length && tokens[i].type === type) return tokens[i++].value;
  };

  var mustConsume = function (type) {
    var value = tryConsume(type);
    if (value !== undefined) return value;
    var _a = tokens[i],
        nextType = _a.type,
        index = _a.index;
    throw new TypeError("Unexpected " + nextType + " at " + index + ", expected " + type);
  };

  var consumeText = function () {
    var result = "";
    var value; // tslint:disable-next-line

    while (value = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result += value;
    }

    return result;
  };

  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");

    if (name || pattern) {
      var prefix = char || "";

      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }

      if (path) {
        result.push(path);
        path = "";
      }

      result.push({
        name: name || key++,
        prefix: prefix,
        suffix: "",
        pattern: pattern || defaultPattern,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }

    var value = char || tryConsume("ESCAPED_CHAR");

    if (value) {
      path += value;
      continue;
    }

    if (path) {
      result.push(path);
      path = "";
    }

    var open = tryConsume("OPEN");

    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? defaultPattern : pattern_1,
        prefix: prefix,
        suffix: suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }

    mustConsume("END");
  }

  return result;
}
/**
 * Compile a string to a template function for the path.
 */

function compile(str, options) {
  return tokensToFunction(parse(str, options), options);
}
/**
 * Expose a method for transforming tokens into the path function.
 */

function tokensToFunction(tokens, options) {
  if (options === void 0) {
    options = {};
  }

  var reFlags = flags(options);
  var _a = options.encode,
      encode = _a === void 0 ? function (x) {
    return x;
  } : _a,
      _b = options.validate,
      validate = _b === void 0 ? true : _b; // Compile all the tokens into regexps.

  var matches = tokens.map(function (token) {
    if (typeof token === "object") {
      return new RegExp("^(?:" + token.pattern + ")$", reFlags);
    }
  });
  return function (data) {
    var path = "";

    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i];

      if (typeof token === "string") {
        path += token;
        continue;
      }

      var value = data ? data[token.name] : undefined;
      var optional = token.modifier === "?" || token.modifier === "*";
      var repeat = token.modifier === "*" || token.modifier === "+";

      if (Array.isArray(value)) {
        if (!repeat) {
          throw new TypeError("Expected \"" + token.name + "\" to not repeat, but got an array");
        }

        if (value.length === 0) {
          if (optional) continue;
          throw new TypeError("Expected \"" + token.name + "\" to not be empty");
        }

        for (var j = 0; j < value.length; j++) {
          var segment = encode(value[j], token);

          if (validate && !matches[i].test(segment)) {
            throw new TypeError("Expected all \"" + token.name + "\" to match \"" + token.pattern + "\", but got \"" + segment + "\"");
          }

          path += token.prefix + segment + token.suffix;
        }

        continue;
      }

      if (typeof value === "string" || typeof value === "number") {
        var segment = encode(String(value), token);

        if (validate && !matches[i].test(segment)) {
          throw new TypeError("Expected \"" + token.name + "\" to match \"" + token.pattern + "\", but got \"" + segment + "\"");
        }

        path += token.prefix + segment + token.suffix;
        continue;
      }

      if (optional) continue;
      var typeOfMessage = repeat ? "an array" : "a string";
      throw new TypeError("Expected \"" + token.name + "\" to be " + typeOfMessage);
    }

    return path;
  };
}
/**
 * Create path match function from `path-to-regexp` spec.
 */

function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
/**
 * Create a path match function from `path-to-regexp` output.
 */

function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }

  var _a = options.decode,
      decode = _a === void 0 ? function (x) {
    return x;
  } : _a;
  return function (pathname) {
    var m = re.exec(pathname);
    if (!m) return false;
    var path = m[0],
        index = m.index;
    var params = Object.create(null);

    var _loop_1 = function (i) {
      // tslint:disable-next-line
      if (m[i] === undefined) return "continue";
      var key = keys[i - 1];

      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i].split(key.prefix + key.suffix).map(function (value) {
          return decode(value, key);
        });
      } else {
        params[key.name] = decode(m[i], key);
      }
    };

    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }

    return {
      path: path,
      index: index,
      params: params
    };
  };
}
/**
 * Escape a regular expression string.
 */

function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
/**
 * Get the flags for a regexp from the options.
 */


function flags(options) {
  return options && options.sensitive ? "" : "i";
}
/**
 * Pull out keys from a regexp.
 */


function regexpToRegexp(path, keys) {
  if (!keys) return path; // Use a negative lookahead to match only capturing groups.

  var groups = path.source.match(/\((?!\?)/g);

  if (groups) {
    for (var i = 0; i < groups.length; i++) {
      keys.push({
        name: i,
        prefix: "",
        suffix: "",
        modifier: "",
        pattern: ""
      });
    }
  }

  return path;
}
/**
 * Transform an array into a regexp.
 */


function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function (path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:" + parts.join("|") + ")", flags(options));
}
/**
 * Create a path regexp from string input.
 */


function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse(path, options), keys, options);
}
/**
 * Expose a function for taking tokens and returning a RegExp.
 */


function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }

  var _a = options.strict,
      strict = _a === void 0 ? false : _a,
      _b = options.start,
      start = _b === void 0 ? true : _b,
      _c = options.end,
      end = _c === void 0 ? true : _c,
      _d = options.encode,
      encode = _d === void 0 ? function (x) {
    return x;
  } : _d;
  var endsWith = "[" + escapeString(options.endsWith || "") + "]|$";
  var delimiter = "[" + escapeString(options.delimiter || "/#?") + "]";
  var route = start ? "^" : ""; // Iterate over the tokens and create our regexp string.

  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];

    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));

      if (token.pattern) {
        if (keys) keys.push(token);

        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:" + prefix + "((?:" + token.pattern + ")(?:" + suffix + prefix + "(?:" + token.pattern + "))*)" + suffix + ")" + mod;
          } else {
            route += "(?:" + prefix + "(" + token.pattern + ")" + suffix + ")" + token.modifier;
          }
        } else {
          route += "(" + token.pattern + ")" + token.modifier;
        }
      } else {
        route += "(?:" + prefix + suffix + ")" + token.modifier;
      }
    }
  }

  if (end) {
    if (!strict) route += delimiter + "?";
    route += !options.endsWith ? "$" : "(?=" + endsWith + ")";
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiter.indexOf(endToken[endToken.length - 1]) > -1 : // tslint:disable-next-line
    endToken === undefined;

    if (!strict) {
      route += "(?:" + delimiter + "(?=" + endsWith + "))?";
    }

    if (!isEndDelimited) {
      route += "(?=" + delimiter + "|" + endsWith + ")";
    }
  }

  return new RegExp(route, flags(options));
}
/**
 * Normalize the given path string, returning a regular expression.
 *
 * An empty array can be passed in for the keys, which will hold the
 * placeholder key descriptions. For example, using `/user/:id`, `keys` will
 * contain `[{ name: 'id', delimiter: '/', optional: false, repeat: false }]`.
 */

function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp) return regexpToRegexp(path, keys);
  if (Array.isArray(path)) return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}

function addRoute(cfg, named, parent) {
  let {
    path,
    children,
    alias,
    meta,
    component,
    components,
    ...p
  } = cfg;
  let end = !(Array.isArray(children) && children.length);

  if (!path || path === '*') {
    path = '';
    end = false;
  }

  if (path[0] !== '/') {
    path = `${(parent === null || parent === void 0 ? void 0 : parent.path) || ''}/${path}`;
  }

  path = cleanPath(path);

  if (component) {
    if (!components) {
      components = {};
    }

    components.default = component;
  }

  const item = { ...p,
    path,
    alias,
    component,
    components,
    meta: meta || {},
    toPath: compile(path || '', {
      encode: encodeURIComponent
    }),
    match: match(path || '', {
      end,
      decode: decodeURIComponent
    })
  };

  if (alias) {
    named[alias] = item;
  }

  if (Array.isArray(children)) {
    item.children = children.map(c => addRoute(c, named, item));
  }

  return item;
}
function* matchRoutes(path, routes = []) {
  for (const route of routes) {
    const result = route.match(path);

    if (!result) {
      continue;
    }

    if (route.components || route.redirect) {
      yield { ...result,
        route
      };
    }

    if (!route.redirect) {
      yield* matchRoutes(path, route.children);
    }

    return;
  }
}

function getValue(v) {
  if (v === undefined) {
    return undefined;
  }

  if (v === null) {
    return null;
  }

  if (v === false) {
    return undefined;
  }

  if (typeof v === 'number' && !Number.isFinite(v)) {
    return;
  }

  if (typeof v === 'function') {
    return;
  }

  return encodeURIComponent(String(v));
}

function stringify(s) {
  const list = [];

  for (const key of Object.keys(s)) {
    const value = s[key];
    const k = encodeURIComponent(key);

    if (!Array.isArray(value)) {
      const v = getValue(value);

      if (v === undefined) {
        continue;
      }

      list.push(v === null ? k : `${k}=${v}`);
      continue;
    }

    for (const val of value) {
      const v = getValue(val);

      if (v === undefined) {
        continue;
      }

      list.push(v === null ? k : `${k}=${v}`);
    }
  }

  return list.join('&');
}
function parse$1(s) {
  const query = Object.create(null);

  function set(k, v = null) {
    if (!(k in query)) {
      query[k] = v;
      return;
    }

    const it = query[k];

    if (Array.isArray(it)) {
      it.push(v);
    } else {
      query[k] = [it, v];
    }
  }

  for (const it of s.split('&')) {
    const index = it.indexOf('=');

    if (index < 0) {
      set(decodeURIComponent(it));
      continue;
    }

    const k = decodeURIComponent(it.substr(0, index));
    const v = decodeURIComponent(it.substr(index + 1));
    set(k, v);
  }

  return query;
}

class StoreHistory {
  constructor(router) {
    _defineProperty(this, "router", void 0);

    _defineProperty(this, "index", 0);

    _defineProperty(this, "history", []);

    this.router = router;
  }

  push(path, search, hash, state) {
    this.history.length = this.index + 1;
    this.index++;
    this.history.push([path, search, hash, state]);
  }

  replace(path, search, hash, state) {
    this.history[this.index] = [path, search, hash, state];
  }

  go(index) {
    let newIndex = this.index + index;

    if (newIndex >= this.history.length) {
      return;
    }

    if (newIndex < 0) {
      return;
    }

    if (newIndex === this.index) {
      return;
    }

    this.index = newIndex;
    return this.history[newIndex];
  }

  back() {
    return this.go(-1);
  }

  forward() {
    return this.go(1);
  }

  link({
    id,
    class: className,
    style
  }, {
    childNodes,
    emit
  }, onClick) {
    return createElement('span', {
      id,
      class: className,
      style,
      'n-on': emit.omit('click'),
      '@click': (...any) => {
        if (!emit('click', ...any)) {
          return;
        }

        onClick();
      }
    }, ...childNodes);
  }

}

class WebPathHistory {
  constructor(router, opt) {
    _defineProperty(this, "router", void 0);

    _defineProperty(this, "base", void 0);

    this.router = router;
    let base = cleanPath((opt === null || opt === void 0 ? void 0 : opt.base) || '');
    this.base = base === '/' ? '' : base;

    const f = () => {
      this.router._update(this.getPath(), location.search, location.hash, history.state);
    };

    window.addEventListener('popstate', f);

    this.destroy = () => {
      this.destroy = () => {};

      window.removeEventListener('popstate', f);
    };
  }

  start() {
    this.router._update(this.getPath(), location.search, location.hash, history.state);
  }

  destroy() {}

  push(path, search, hash, state) {
    history.pushState(state, '', `${this.base}${path}${search}${hash}`);
  }

  replace(path, search, hash, state) {
    history.replaceState(state, '', `${this.base}${path}${search}${hash}`);
  }

  getPath() {
    const path = location.pathname;
    const {
      base
    } = this;

    if (!base) {
      return path;
    }

    if (path.indexOf(`${base}/`) !== 0) {
      return path;
    }

    return path.substr(base.length);
  }

  go(index) {
    const old = {
      path: this.getPath(),
      search: location.search,
      hash: location.hash,
      state: history.state
    };
    history.go(index);
    const path = this.getPath();
    const search = location.search;
    const hash = location.hash;
    const state = history.state;

    if (path !== old.path || search !== old.search || hash !== old.hash || state !== old.state) {
      return [path, search, hash, state];
    }
  }

  back() {
    return this.go(-1);
  }

  forward() {
    return this.go(1);
  }

  link({
    to,
    onclick,
    id,
    class: className,
    style
  }, {
    childNodes,
    emit
  }, onClick) {
    return createElement('a', {
      id,
      class: className,
      style,
      href: `${this.base}${this.router.getUrl(to)}`,
      'n-on': emit.omit('click'),
      '@click': e => {
        let cancel = !emit('click', e);

        if (typeof onclick === 'function') {
          onclick(e);
        }

        if (e.defaultPrevented) {
          return;
        }

        e.preventDefault();

        if (cancel) {
          return;
        }

        onClick();
      }
    }, ...childNodes);
  }

}

function parse$2(p) {
  const result = /^([^?#]*)((?:\?[^#]*)?)((?:#.*)?)$/.exec(p);

  if (!result) {
    return ['/', '', ''];
  }

  return [result[1] || '/', result[2], result[3]];
}

class WebPathHistory$1 {
  constructor(router) {
    _defineProperty(this, "router", void 0);

    this.router = router;

    const f = () => {
      const [path, search, hash] = parse$2(location.hash.substr(1));

      this.router._update(path, search, hash);
    };

    window.addEventListener('hashchange', f);

    this.destroy = () => {
      this.destroy = () => {};

      window.removeEventListener('hashchange', f);
    };
  }

  start() {
    const [path, search, hash] = parse$2(location.hash.substr(1));

    this.router._update(path, search, hash);
  }

  destroy() {}

  push(path, search, hash) {
    location.hash = `#${path}${search}${hash}`;
  }

  replace(path, search, hash) {
    location.replace(`#${path}${search}${hash}`);
  }

  go(index) {
    const oldHash = location.hash;
    history.go(index);
    const hash = location.hash;

    if (hash === oldHash) {
      return;
    }

    return [...parse$2(hash.substr(1)), undefined];
  }

  back() {
    return this.go(-1);
  }

  forward() {
    return this.go(1);
  }

  link({
    to,
    onclick,
    id,
    class: className,
    style
  }, {
    childNodes,
    emit
  }, onClick) {
    return createElement('a', {
      id,
      class: className,
      style,
      href: `#${this.router.getUrl(to)}`,
      'n-on': emit.omit('click'),
      '@click': e => {
        let cancel = !emit('click', e);

        if (typeof onclick === 'function') {
          onclick(e);
        }

        if (e.defaultPrevented) {
          return;
        }

        e.preventDefault();

        if (cancel) {
          return;
        }

        onClick();
      }
    }, ...childNodes);
  }

}



var history$1 = /*#__PURE__*/Object.freeze({
	__proto__: null,
	Memory: StoreHistory,
	WebPath: WebPathHistory,
	WebHash: WebPathHistory$1
});

function get(location, routes, basePath, stringifyQuery = stringify) {
  if (typeof location === 'string') {
    location = {
      path: location
    };
  }

  const route = location.alias && routes[location.alias];
  const result = location.path && /^([^?#]*)((?:\?[^#]*)?)((?:#.*)?)$/.exec(location.path);
  let path = (result === null || result === void 0 ? void 0 : result[1]) || '';

  if (!path) {
    path = route ? route.toPath(location.params || {}) : basePath;
  } else if (route) {
    let routePath = route.toPath(location.params || {});

    if (!location.append) {
      routePath = routePath.replace(/\/[^/]*\/?$/, '');
    }

    path = `${route.toPath(location.params || {})}/${path}`;
  } else if (location.append) {
    path = `${basePath}/${path}`;
  }

  if (path[0] !== '/') {
    path = `${basePath.replace(/\/[^/]*\/?$/, '')}/${path}`;
  }

  path = cleanPath(path);
  const search = location.query && `?${stringifyQuery(location.query)}` || location.search || (result === null || result === void 0 ? void 0 : result[2]) || '';
  const hash = location.hash || (result === null || result === void 0 ? void 0 : result[3]) || '';
  return {
    path,
    search,
    hash
  };
}

function update(obj, props = {}) {
  const newKeys = new Set(Reflect.ownKeys(props));

  for (const k of Reflect.ownKeys(obj)) {
    if (!newKeys.has(k)) {
      delete obj[k];
    }
  }

  for (const k of newKeys) {
    obj[k] = props[k];
  }

  return obj;
}

const redirects = [];

class Router {
  static get history() {
    return history$1;
  }

  static get install() {
    return install;
  }

  static get View() {
    return RouterView;
  }

  static get Link() {
    return RouterLink;
  }

  get size() {
    return this._size();
  }

  get matches() {
    return this._matches();
  }

  get alias() {
    return this._alias();
  }

  get path() {
    return this._path();
  }

  get search() {
    return this._search();
  }

  get hash() {
    return this._hash();
  }

  get state() {
    return this._state();
  }

  constructor({
    History,
    historyOption
  }) {
    _defineProperty(this, "_namedRoutes", Object.create(null));

    _defineProperty(this, "_routes", []);

    _defineProperty(this, "history", void 0);

    _defineProperty(this, "_size", value(0));

    _defineProperty(this, "_nodes", []);

    _defineProperty(this, "_matches", value([]));

    _defineProperty(this, "_hash", value(''));

    _defineProperty(this, "_search", value(''));

    _defineProperty(this, "_alias", value(''));

    _defineProperty(this, "_path", value('/'));

    _defineProperty(this, "_state", value(undefined));

    _defineProperty(this, "params", encase(Object.create(null)));

    _defineProperty(this, "query", encase(Object.create(null)));

    _defineProperty(this, "meta", encase(Object.create(null)));

    if (History) {
      var _history$start;

      const history = new History(this, historyOption);
      this.history = history;
      (_history$start = history.start) === null || _history$start === void 0 ? void 0 : _history$start.call(history);
    }
  }

  setRoutes(routes) {
    const named = Object.create(null);
    this._routes = routes.map(c => addRoute(c, named));
    this._namedRoutes = named;

    this._update(this._path(), this._search(), this._hash(), this._state(), true);
  }

  _get(index) {
    var _this$_nodes$index, _this$_nodes;

    const item = (_this$_nodes$index = (_this$_nodes = this._nodes)[index]) === null || _this$_nodes$index === void 0 ? void 0 : _this$_nodes$index.call(_this$_nodes);

    if (!item) {
      this._size();

      return undefined;
    }

    return item;
  }

  _update(path, search, hash, state, force = false) {
    if (this._path() !== path || force) {
      var _last$route, _last$route2;

      const matches = [...matchRoutes(path, this._routes)];
      const last = matches[matches.length - 1];

      if (last && !last.route.components) {
        redirects.push(path);

        if (redirects.length >= 10) {
          throw new Error(`Too many consecutive redirect jumps: \n${redirects.join('\n')}`, 'router');
        }

        const {
          redirect,
          append
        } = last.route;

        try {
          if (append) {
            this.replace(`${path}/${redirect}`, state);
          } else if (redirect && redirect[0] === '/') {
            this.replace(redirect, state);
          } else {
            this.replace(`${path}/../${redirect}`, state);
          }

          return;
        } finally {
          redirects.pop();
        }
      }

      const nodes = this._nodes;
      const nodesLength = nodes.length;
      const matchesLength = matches.length;
      const min = Math.min(matchesLength, nodesLength);

      for (let i = 0; i < min; i++) {
        nodes[i](matches[i]);
      }

      for (let i = min; i < nodesLength; i++) {
        nodes[i](undefined);
      }

      for (let i = min; i < matchesLength; i++) {
        nodes[i] = value(matches[i]);
      }

      nodes.length = matchesLength;

      this._size(matchesLength);

      this._matches(matches);

      this._path(path);

      this._alias((last === null || last === void 0 ? void 0 : (_last$route = last.route) === null || _last$route === void 0 ? void 0 : _last$route.alias) || '');

      update(this.params, (last === null || last === void 0 ? void 0 : last.params) || {});
      update(this.meta, (last === null || last === void 0 ? void 0 : (_last$route2 = last.route) === null || _last$route2 === void 0 ? void 0 : _last$route2.meta) || {});
    }

    if (this._search() !== search) {
      this._search(search);

      update(this.query, (this.parse || parse$1)(search.substr(1)));
    }

    this._hash(hash);

    this._state(state);
  }

  push(location, state) {
    var _this$history;

    const {
      path,
      search,
      hash
    } = get(location, this._namedRoutes, this._path(), this.stringify);
    (_this$history = this.history) === null || _this$history === void 0 ? void 0 : _this$history.push(path, search, hash, state);

    this._update(path, search, hash, state);
  }

  replace(location, state) {
    var _this$history2;

    const {
      path,
      search,
      hash
    } = get(location, this._namedRoutes, this._path(), this.stringify);
    (_this$history2 = this.history) === null || _this$history2 === void 0 ? void 0 : _this$history2.replace(path, search, hash, state);

    this._update(path, search, hash, state);
  }

  getUrl(location) {
    const {
      path,
      search,
      hash
    } = get(location, this._namedRoutes, this._path(), this.stringify);
    return `${path}${search}${hash}`;
  }

  go(index) {
    var _this$history3;

    const it = (_this$history3 = this.history) === null || _this$history3 === void 0 ? void 0 : _this$history3.go(index);

    if (!it) {
      return;
    }

    this._update(...it);
  }

  back() {
    var _this$history4;

    const it = (_this$history4 = this.history) === null || _this$history4 === void 0 ? void 0 : _this$history4.back();

    if (!it) {
      return;
    }

    this._update(...it);
  }

  forward() {
    var _this$history5;

    const it = (_this$history5 = this.history) === null || _this$history5 === void 0 ? void 0 : _this$history5.forward();

    if (!it) {
      return;
    }

    this._update(...it);
  }

  get view() {
    const view = (props, ...p) => RouterView({ ...props,
      router: this
    }, ...p);

    mName('Router', view);
    mSimple(view);
    Reflect.defineProperty(this, 'view', {
      value: view,
      enumerable: true,
      configurable: true
    });
    return view;
  }

}

export default Router;

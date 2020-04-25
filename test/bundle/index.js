(function (factory) {
  typeof define === 'function' && define.amd ? define(factory) :
  factory();
}((function () { 'use strict';

  /*!
   * monitorable v0.1.0-alpha.7
   * (c) 2020 Fierflame
   * @license MIT
   */
  /** 打印错误 */

  function printError(info) {

    console.error(info);
  }
  /** 回调函数安全化处理 */


  function safeify(fn) {
    return (...p) => {
      try {
        fn(...p);
      } catch (e) {
        printError(e);
      }
    };
  }

  function getIndexes(target, prop) {
    if (!target) {
      return undefined;
    }

    if (typeof target !== 'function' && typeof target !== 'object') {
      return undefined;
    }

    if (typeof prop === 'number') {
      return [target, String(prop)];
    }

    if (typeof prop === 'symbol') {
      return [target, prop];
    }

    if (typeof prop === 'string') {
      return [target, prop];
    }

    if (typeof prop === 'boolean') {
      return [target, prop];
    }

    return undefined;
  }

  function getMapValue(map, key, def) {
    if (map.has(key)) {
      return map.get(key);
    }

    const value = def();
    map.set(key, value);
    return value;
  }
  /** 已被读取的 */


  let read;
  /**
   * 标记已读状态
   * @param obj  要标记的对象
   * @param prop 要标记的属性
   */

  function markRead(target, prop) {
    if (!read) {
      return;
    }

    const indexes = getIndexes(target, prop);

    if (!indexes) {
      return;
    }

    [target, prop] = indexes;
    const propMap = getMapValue(read, target, () => new Map());

    if (propMap.has(prop)) {
      return;
    }

    propMap.set(prop, false);
  }
  /**
   * 监听函数的执行，并将执行过程中读取的对象值设置到 map 中
   * @param fn 要执行的含糊
   * @param map 用于存储被读取对象的 map
   */


  function observeRun(map, fn, options) {
    const oldRead = read;
    read = map;

    try {
      if (!(options === null || options === void 0 ? void 0 : options.postpone)) {
        return fn();
      }

      return postpone(fn, options.postpone === 'priority');
    } finally {
      read = oldRead;
    }
  }

  function observe(map, fn, options) {
    if (typeof fn === 'function') {
      return observeRun(map, fn, options);
    }

    if (typeof options !== 'function') {
      throw new Error('fn needs to be a function');
    }

    return observeRun(map, options, fn);
  }

  const watchList = new WeakMap();

  function execWatch(target, prop) {
    var _watchList$get;

    const watch = (_watchList$get = watchList.get(target)) === null || _watchList$get === void 0 ? void 0 : _watchList$get.get(prop);

    if (!watch) {
      return;
    }

    [...watch].forEach(w => w());
  }

  let waitList;

  function run(list) {
    for (const [target, set] of list.entries()) {
      var _read;

      const propMap = (_read = read) === null || _read === void 0 ? void 0 : _read.get(target);

      for (const prop of set) {
        execWatch(target, prop);

        if (propMap === null || propMap === void 0 ? void 0 : propMap.has(prop)) {
          propMap.set(prop, true);
        }
      }
    }
  }

  function postponeRun(f, priority) {
    const list = !priority && waitList || new Map();
    const old = waitList;
    waitList = list;

    try {
      return f();
    } finally {
      waitList = old;

      if (list !== waitList) {
        run(list);
      }
    }
  }

  function postpone(fn, priority) {
    if (typeof fn === 'function') {
      return postponeRun(fn, priority);
    }

    if (typeof priority !== 'function') {
      throw new Error('fn needs to be a function');
    }

    return postponeRun(priority, fn);
  }

  function wait(target, prop) {
    if (!waitList) {
      return false;
    }

    getMapValue(waitList, target, () => new Set()).add(prop);
    return true;
  }
  /**
   * 标记属性的修改，同时触发监听函数
   * @param target 要标记的对象
   * @param prop   要标记的属性 特别的，false 表示原型，true 表示成员
   */


  function markChange(target, prop) {
    const indexes = getIndexes(target, prop);

    if (!indexes) {
      return;
    }

    [target, prop] = indexes;

    if (wait(target, prop)) {
      return;
    }

    execWatch(target, prop);
  }
  /**
   * 观察对象属性的变化
   * @param target 要观察的对象
   * @param prop   要观察的属性名 特别的，false 表示原型，true 表示成员
   * @param fn     属性改变后触发的函数
   */


  function watchProp(target, prop, cb) {
    if (typeof cb !== 'function') {
      return () => {};
    }

    const indexes = getIndexes(target, prop);

    if (!indexes) {
      return () => {};
    }

    [target, prop] = indexes;
    const key = prop;
    let map = watchList.get(target);

    if (!map) {
      map = new Map();
      watchList.set(target, map);
    }

    const list = getMapValue(map, key, () => new Set());
    cb = safeify(cb);
    list.add(cb);
    let removed = false;
    return () => {
      if (removed) {
        return;
      }

      removed = true; // 从当前列表中移除

      list.delete(cb); // 从属性关联中删除

      if (list.size) {
        return;
      }

      if (!map) {
        return;
      }

      map.delete(key); // 映射列表中删除

      if (map.size) {
        return;
      }

      watchList.delete(target);
    };
  }
  /**
   * 判断对象是否可被代理
   */


  function encashable$1(v) {
    return Boolean(v && ['object', 'function'].includes(typeof v));
  }

  let getValue;
  /**
   * 获取被代理对象
   * @param obj  要被代理的对象
   * @param nest 递归代理的层数
   */

  function encase(value, nest = 0) {
    if (!encashable$1(value)) {
      return value;
    }

    const original = recover(value);
    const nestLayer = nest === true ? Infinity : nest || 0;
    const proxy = new Proxy(original, {
      set(target, prop, value, receiver) {
        if (nest === false) {
          return Reflect.set(target, prop, value, receiver);
        }

        const has = Reflect.has(target, prop);
        const modified = Reflect.set(target, prop, value, encase(receiver));

        if (!modified) {
          return modified;
        }

        if (has !== Reflect.has(target, prop)) {
          markChange(target, true);
        }

        return modified;
      },

      get(target, prop, receiver) {
        if (getValue === proxy) {
          if (prop === '__monitorable__recover__') {
            getValue = original;
            return;
          }
        }

        if (nest === false) {
          return Reflect.get(target, prop, receiver);
        }

        markRead(target, prop);
        const value = Reflect.get(target, prop, encase(receiver));

        if (nestLayer > 0) {
          return encase(value, nestLayer - 1);
        }

        return value;
      },

      setPrototypeOf(target, proto) {
        if (nest === false) {
          return Reflect.setPrototypeOf(target, proto);
        }

        const oldProto = Reflect.getPrototypeOf(target);
        const modified = Reflect.setPrototypeOf(target, proto);

        if (modified && oldProto !== proto) {
          markChange(target, false);
        }

        return modified;
      },

      getPrototypeOf(target) {
        if (nest === false) {
          return Reflect.getPrototypeOf(target);
        }

        markRead(target, false);
        const value = Reflect.getPrototypeOf(target);

        if (nestLayer > 0) {
          return encase(value, nestLayer - 1);
        }

        return value;
      },

      defineProperty(target, prop, attr) {
        if (nest === false) {
          return Reflect.defineProperty(target, prop, attr);
        }

        let changed = true;

        if ('value' in attr) {
          const desc = Reflect.getOwnPropertyDescriptor(target, prop);

          if (desc && 'value' in desc && recover(attr.value) === recover(desc.value)) {
            changed = false;
          }
        }

        const modified = Reflect.defineProperty(target, prop, attr);

        if (changed && modified) {
          markChange(target, prop);
        }

        return modified;
      },

      getOwnPropertyDescriptor(target, prop) {
        if (nest === false) {
          return Reflect.getOwnPropertyDescriptor(target, prop);
        }

        markRead(target, prop);
        return Reflect.getOwnPropertyDescriptor(target, prop);
      },

      deleteProperty(target, prop) {
        if (nest === false) {
          return Reflect.deleteProperty(target, prop);
        }

        const has = Reflect.has(target, prop);
        const deleted = Reflect.deleteProperty(target, prop);

        if (has && !Reflect.has(target, prop)) {
          markChange(target, prop);
          markChange(target, true);
        }

        return deleted;
      },

      ownKeys(target) {
        if (nest === false) {
          return Reflect.ownKeys(target);
        }

        markRead(target, true);
        return Reflect.ownKeys(target);
      },

      has(target, prop) {
        if (nest === false) {
          return Reflect.has(target, prop);
        }

        markRead(target, true);
        return Reflect.has(target, prop);
      }

    });
    return proxy;
  }
  /** 获取被代理的原始值 */


  function recover(v) {
    if (!v) {
      return v;
    }

    if (!encashable$1(v)) {
      return v;
    }

    let value = v;

    try {
      getValue = v;
      value = v.__monitorable__recover__;
    } catch (_unused) {}

    value = getValue;
    getValue = false;

    if (!value) {
      return v;
    }

    if (typeof value === 'object') {
      return value;
    }

    if (typeof value === 'function') {
      return value;
    }

    return v;
  }

  function run$1(cb, fn, options) {
    cb = safeify(cb);
    let cancelList;
    const postpone = options === null || options === void 0 ? void 0 : options.postpone;
    let end = false;
    /** 取消监听 */

    function cancel() {
      if (end) {
        return false;
      }

      end = true;

      if (!cancelList) {
        return true;
      }

      const list = cancelList;
      cancelList = undefined;
      list.forEach(f => f());
      return true;
    }

    function trigger() {
      if (!cancel()) {
        return;
      }

      cb(true);
    }

    function run(thisRead) {
      if (end) {
        return false;
      }

      if (!thisRead.size) {
        end = true;
        return cb(false);
      }

      const list = [];

      for (let [obj, props] of thisRead) {
        for (const [p, m] of props) {
          if (m) {
            return cb(true);
          }

          list.push([obj, p]);
        }
      }

      cancelList = list.map(([obj, p]) => watchProp(recover(obj), p, trigger));
    }

    function stop() {
      if (!cancel()) {
        return;
      }

      cb(false);
    }

    const thisRead = new Map();
    const result = observe(thisRead, () => fn(stop), {
      postpone
    });
    run(thisRead);

    if (options === null || options === void 0 ? void 0 : options.resultOnly) {
      return result;
    }

    return {
      result,
      stop
    };
  }
  /**
   * 创建可监听执行函数
   * @param fn 要监听执行的函数
   * @param cb 当监听的值发生可能改变时触发的回调函数，单如果没有被执行的函数或抛出错误，将会在每次 fn 被执行后直接执行
   */


  function exec(cb, fn, options) {
    if (typeof cb !== 'function') {
      throw new Error('cb needs to be a function');
    }

    if (typeof fn === 'function') {
      return run$1(cb, fn, options);
    }

    if (typeof options !== 'function') {
      throw new Error('fn needs to be a function');
    }

    return run$1(cb, options, fn);
  }
  /**
   * 创建可监听执行函数
   * @param fn 要监听执行的函数
   * @param cb 当监听的值发生可能改变时触发的回调函数，单如果没有被执行的函数或抛出错误，将会在每次 fn 被执行后直接执行
   */


  function create(cb, fn, options) {
    cb = safeify(cb);
    let cancelList;
    /** 取消监听 */

    function cancel() {
      if (!cancelList) {
        return false;
      }

      const list = cancelList;
      cancelList = undefined;
      list.forEach(f => f());
      return true;
    }

    function trigger() {
      if (!cancel()) {
        return;
      }

      cb(true);
    }

    function run(thisRead) {
      if (!thisRead.size) {
        return cb(false);
      }

      const list = [];

      for (let [obj, props] of thisRead) {
        for (const [p, m] of props) {
          if (m) {
            return cb(true);
          }

          list.push([obj, p]);
        }
      }

      cancelList = list.map(([obj, p]) => watchProp(recover(obj), p, trigger));
    }

    function exec() {
      cancel();
      const thisRead = new Map();
      const result = observe(thisRead, fn, options);
      run(thisRead);
      return result;
    }

    exec.stop = () => {
      if (!cancel()) {
        return;
      }

      cb(false);
    };

    return exec;
  }
  /**
   * 创建可监听执行函数
   * @param fn 要监听执行的函数
   * @param cb 当监听的值发生可能改变时触发的回调函数，单如果没有被执行的函数或抛出错误，将会在每次 fn 被执行后直接执行
   */


  function createExecutable(cb, fn, options) {
    if (typeof fn === 'function') {
      return create(cb, fn, options);
    }

    if (typeof options !== 'function') {
      throw new Error('fn needs to be a function');
    }

    return create(cb, options, fn);
  }
  /** 取消监听的方法 */


  const values = new WeakSet();

  function isValue(x) {
    return values.has(x);
  }
  /** 触发监听 */


  function valueOf() {
    const value = this();

    if (value === undefined) {
      return value;
    }

    if (value === null) {
      return value;
    }

    return value.valueOf();
  }

  function toString(...p) {
    const value = this();

    if (value === undefined) {
      return String(value);
    }

    if (value === null) {
      return String(value);
    }

    if (typeof value.toString === 'function') {
      return value.toString(...p);
    }

    return String(value);
  }

  function toPrimitive(hint) {
    const value = this();

    if (value === undefined) {
      return String(value);
    }

    if (value === null) {
      return String(value);
    }

    if (typeof value[Symbol.toPrimitive] === 'function') {
      return value[Symbol.toPrimitive](hint);
    }

    if (hint === 'string') {
      return String(value);
    }

    if (hint === 'number') {
      return Number(value);
    }

    return value;
  }

  function createValue(recover, setValue, stop = () => {}, change = () => {}) {
    function set(v, marked = false) {
      if (!setValue) {
        return;
      }

      try {
        setValue(v, () => {
          marked = true;
        });
      } finally {
        if (marked) {
          trigger();
        }
      }
    }

    function get() {
      markRead(value, 'value');
      return recover();
    }

    const value = (...v) => {
      if (v.length) {
        set(v[0], v[1]);
        return v[0];
      }

      return get();
    };

    Reflect.defineProperty(value, 'value', {
      get,
      set,
      enumerable: true,
      configurable: true
    });
    Reflect.defineProperty(value, 'valueOf', {
      value: valueOf,
      enumerable: true,
      configurable: true
    });
    Reflect.defineProperty(value, 'toString', {
      value: toString,
      enumerable: true,
      configurable: true
    });
    Reflect.defineProperty(value, Symbol.toPrimitive, {
      value: toPrimitive,
      enumerable: true,
      configurable: true
    });

    function watch(cb) {
      if (!callbacks) {
        return () => {};
      }

      cb = safeify(cb);
      callbacks.push(cb);
      change();
      let cancelled = false;
      return () => {
        if (cancelled) {
          return;
        }

        cancelled = true;

        if (!callbacks) {
          return;
        }

        const index = callbacks.findIndex(a => a === cb);

        if (index < 0) {
          return;
        }

        callbacks.splice(index, 1);
        change();
      };
    }

    let callbacks = [];
    Reflect.defineProperty(value, 'watch', {
      get() {
        return watch;
      },

      set() {},

      configurable: true
    });

    const trigger = () => {
      if (!callbacks) {
        return;
      }

      markChange(value, 'value');

      for (const cb of [...callbacks]) {
        cb(value, false);
      }
    };

    trigger.has = () => {
      var _callbacks;

      return Boolean((_callbacks = callbacks) === null || _callbacks === void 0 ? void 0 : _callbacks.length);
    };

    trigger.stop = () => {
      if (!callbacks) {
        return;
      }

      const list = callbacks;
      callbacks = undefined;

      for (const cb of [...list]) {
        cb(value, true);
      }
    };

    values.add(value);
    let stopped = false;

    value.stop = () => {
      if (stopped) {
        return;
      }

      stopped = true;
      stop();
      trigger.stop();
    };

    return {
      value,
      trigger
    };
  }
  /**
   * 创建引用值
   * @param value 初始值
   * @param options 选项
   */


  function value(def, options) {
    const proxy = options === true || options && options.proxy;
    let source;
    let proxyValue;
    const {
      value
    } = createValue(() => proxyValue, (v, mark) => {
      if (proxy) {
        v = recover(v);
      }

      if (v === source) {
        return;
      }

      source = v;
      proxyValue = proxy ? encase(source) : source;
      mark();
    });
    value(def);
    return value;
  }

  function computed(getter, setter, options) {
    var _options;

    if (typeof setter !== 'function') {
      options = setter;
      setter = undefined;
    }

    const setValue = setter;
    const proxy = options === true || options && options.proxy;
    const postpone = typeof options === 'object' && ((_options = options) === null || _options === void 0 ? void 0 : _options.postpone);
    let source;
    let proxyValue;
    let stopped = false;
    let computed = false;
    let trigger;
    const executable = createExecutable(changed => {
      computed = !changed;

      if (changed && trigger) {
        trigger();
      }
    }, getter, {
      postpone
    });

    function run() {
      computed = true;

      try {
        source = executable();

        if (proxy) {
          source = recover(source);
        }

        proxyValue = proxy ? encase(source) : source;
        return proxyValue;
      } catch (e) {
        if (!stopped) {
          computed = false;
        }

        throw e;
      }
    }

    let value;
    ({
      value,
      trigger
    } = createValue(() => computed || stopped ? proxyValue : run(), setValue && (v => setValue(proxy ? recover(v) : v)), () => {
      if (stopped) {
        return;
      }

      stopped = true;

      if (computed) {
        return;
      }

      run();
    }));
    return value;
  }

  function createValue$1(props, key, def = value(undefined), set) {
    function setValue(value, setted) {
      if (!set) {
        return;
      }

      set(value, setted);
    }

    return computed(() => {
      if (!(key in props)) {
        return def();
      }

      const p = props[key];
      return isValue(p) ? p() : p;
    }, v => {
      if (!(key in props)) {
        def(v);
        setValue(v, false);
        return;
      }

      const p = props[key];

      if (isValue(p)) {
        p(v);
        setValue(v, true);
        return;
      }

      setValue(v, false);
    });
  }

  function valueify(props, key, def, set) {
    if (arguments.length >= 2) {
      return createValue$1(props, key, def, set);
    }

    return (k, d, s) => createValue$1(props, k, d, s);
  }

  /*!
   * Neep v0.1.0-alpha.9
   * (c) 2019-2020 Fierflame
   * @license MIT
   */
  const version = 'undefined';
  const isProduction = "development" === 'production';
  var Constant = /*#__PURE__*/Object.freeze({
    version: version,
    isProduction: isProduction
  });
  const devtools = {
    renderHook() {}

  };

  function installDevtools(tools) {
    if (!tools) {
      return;
    }

    if (typeof tools !== 'object') {
      return;
    }

    const {
      renderHook
    } = tools;

    if (typeof renderHook === 'function') {
      devtools.renderHook = renderHook;
    }
  }

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

  class NeepError extends Error {
    constructor(message, tag = '') {
      super(tag ? `[${tag}] ${message}` : message);

      _defineProperty(this, "tag", void 0);

      this.tag = tag;
    }

  }

  function assert(v, message, tag) {
    if (v) {
      return;
    }

    throw new NeepError(message, tag);
  }

  let nextFrameApi;

  function nextFrame(fn) {
    assert(nextFrameApi, 'The basic renderer is not installed', 'install');
    nextFrameApi(fn);
  }

  const renders = Object.create(null);

  function getRender(type = '') {
    if (typeof type === 'object') {
      return type;
    }

    return renders[type] || renders.default;
  }

  function installRender(render) {
    if (!render) {
      return;
    }

    renders[render.type] = render;

    if (nextFrameApi) {
      return;
    }

    if (!renders.default) {
      renders.default = render;
    }

    if (!nextFrameApi && render.nextFrame) {
      renders.default = render;
      nextFrameApi = render.nextFrame;
    }
  }

  function installMonitorable(api) {}

  function install(apis) {
    installMonitorable(apis.monitorable);
    installRender(apis.render);

    {
      installDevtools(apis.devtools);
    }
  }

  function getEventName(k) {
    if (k[0] === '@') {
      return k.substr(1);
    }

    if (/^on[:-]/.test(k)) {
      return k.substr(3);
    }

    if (/^n([:-])on(\1|:)/.test(k)) {
      return k.substr(5);
    }

    return '';
  }

  function addEventFromCollection(addEvent, events) {
    if (!events) {
      return;
    }

    if (typeof events === 'function') {
      const {
        names
      } = events;

      if (!Array.isArray(names)) {
        return;
      }

      for (const n of names) {
        if (!n) {
          continue;
        }

        addEvent(n, (...p) => events(n, ...p));
      }

      return;
    }

    if (typeof events !== 'object') {
      return;
    }

    for (const k of Object.keys(events)) {
      const f = events[k];

      if (typeof f !== 'function') {
        continue;
      }

      addEvent(k, f);
    }
  }

  class EventEmitter {
    static update(emitter, events) {
      if (!events) {
        return [];
      }

      const newHandles = [];

      if (events && typeof events === 'object') {
        for (const n of Object.keys(events)) {
          if (!n) {
            continue;
          }

          const fn = events[n];

          if (typeof fn !== 'function') {
            continue;
          }

          newHandles.push(emitter.on(n, fn));
        }
      }

      return newHandles;
    }

    static updateInProps(emitter, props, custom) {
      if (!props) {
        return [];
      }

      const newHandles = [];

      function addEvent(entName, listener) {
        newHandles.push(emitter.on(entName, listener));
      }

      for (const k of Object.keys(props)) {
        const fn = props[k];

        if (typeof fn !== 'function') {
          continue;
        }

        const entName = getEventName(k);

        if (!entName) {
          continue;
        }

        addEvent(entName, fn);
      }

      addEventFromCollection(addEvent, props['@']);
      addEventFromCollection(addEvent, props['n:on']);
      addEventFromCollection(addEvent, props['n-on']);

      if (typeof custom === 'function') {
        custom(addEvent);
      }

      newHandles.push(...EventEmitter.update(emitter, props['@']));
      return newHandles;
    }

    get names() {
      return [...this._names];
    }

    constructor() {
      _defineProperty(this, "_names", new Set());

      _defineProperty(this, "_cancelHandles", new Set());

      _defineProperty(this, "emit", void 0);

      _defineProperty(this, "on", void 0);

      const events = Object.create(null);
      const names = this._names;

      function createEmit(...omitNames) {
        function emit(name, ...p) {
          const event = events[name];

          if (!event) {
            return true;
          }

          let res = true;

          for (const fn of [...event]) {
            res = fn(...p) && res;
          }

          return res;
        }

        emit.omit = (...names) => createEmit(...omitNames, ...names);

        Reflect.defineProperty(emit, 'names', {
          get: () => {
            markRead(createEmit, 'names');
            return [...names].filter(t => !omitNames.includes(t));
          },
          configurable: true
        });
        return emit;
      }

      const on = (name, listener) => {
        var _event;

        function fn(...p) {
          try {
            return listener(...p) !== false;
          } catch (e) {
            console.error(e);
            return false;
          }
        }

        let event = events[name];

        if (!((_event = event) === null || _event === void 0 ? void 0 : _event.size)) {
          event = new Set();
          events[name] = event;
          markChange(createEmit, 'names');
          names.add(name);
        }

        event.add(fn);
        let removed = false;
        return () => {
          if (removed) {
            return;
          }

          removed = true;
          event.delete(fn);

          if (event.size) {
            return;
          }

          markChange(createEmit, 'names');
          names.delete(name);
        };
      };

      this.emit = createEmit();
      this.on = on;
    }

    updateHandles(newHandles) {
      const eventCancelHandles = this._cancelHandles;
      const oldHandles = [...eventCancelHandles];
      eventCancelHandles.clear();

      for (const fn of oldHandles) {
        fn();
      }

      newHandles.forEach(f => eventCancelHandles.add(f));
      return newHandles;
    }

    update(list) {
      const handles = EventEmitter.update(this, list);
      return this.updateHandles(handles);
    }

    updateInProps(list, custom) {
      const handles = EventEmitter.updateInProps(this, list, custom);
      return this.updateHandles(handles);
    }

  }

  const components = Object.create(null);

  function register(name, component) {
    components[name] = component;
  }

  const isElementSymbol = Symbol.for('isNeepElement');
  const typeSymbol = Symbol.for('type');
  const nameSymbol = Symbol.for('name');
  const renderSymbol = Symbol.for('render');
  const componentsSymbol = Symbol.for('components');
  const configSymbol = Symbol.for('config');

  function Mark(symbol, value) {
    return component => {
      component[symbol] = value;
      return component;
    };
  }

  function mName(name, component) {
    if (!component) {
      return Mark(nameSymbol, name);
    }

    component[nameSymbol] = name;
    return component;
  }

  function mSimple(component) {
    if (!component) {
      return Mark(typeSymbol, 'simple');
    }

    component[typeSymbol] = 'simple';
    return component;
  }

  function create$1(c, r) {
    if (typeof r === 'function') {
      c[renderSymbol] = r;
    }

    return c;
  }

  function mark(component, ...marks) {
    for (const m of marks) {
      m(component);
    }

    return component;
  }

  const ScopeSlot = 'Neep:ScopeSlot';
  const SlotRender = 'Neep:SlotRender';
  const Slot = 'Neep:Slot';
  const Value = 'Neep:Value';
  const Container = 'Neep:Container';
  const Deliver = 'Neep:Deliver';
  const Template = 'template';
  const Fragment = Template;
  var Tags = /*#__PURE__*/Object.freeze({
    ScopeSlot: ScopeSlot,
    SlotRender: SlotRender,
    Slot: Slot,
    Value: Value,
    Container: Container,
    Deliver: Deliver,
    Template: Template,
    Fragment: Fragment
  });
  let current;

  function setCurrent(fn, entity) {
    const oldEntity = current;
    current = entity;

    try {
      current.$_valueIndex = 0;
      const ret = fn();

      if (current.$_valueIndex !== current.$_values.length) {
        throw new NeepError('Inconsistent number of useValue executions', 'life');
      }

      return ret;
    } finally {
      current = oldEntity;
    }
  }

  function checkCurrent(name, initOnly = false) {
    if (!current) {
      throw new NeepError(`Function \`${name}\` can only be called within a cycle.`, 'life');
    }

    if (!initOnly) {
      return current;
    }

    if (!current.created) {
      return current;
    }

    throw new NeepError(`Function \`${name}\` can only be called at initialization time.`, 'life');
  }

  const constructors = [];

  function initContext(context, exposed) {
    for (const constructor of constructors) {
      constructor(context, exposed);
    }

    return context;
  }

  function addContextConstructor(constructor) {
    constructors.push(safeify(constructor));
  }

  const hooks = Object.create(null);

  function setHook(id, hook, entity) {
    let list = (entity === null || entity === void 0 ? void 0 : entity.$_hooks) || hooks;

    if (!list) {
      return () => {};
    }

    hook = safeify(hook);
    let set = list[id];

    if (!set) {
      set = new Set();
      list[id] = set;
    }

    set.add(hook);
    return () => set.delete(hook);
  }

  function callHook(id, exposed) {
    if (!exposed) {
      return;
    }

    for (const hook of exposed.$_hooks[id] || []) {
      hook(exposed);
    }

    for (const hook of hooks[id] || []) {
      hook(exposed);
    }
  }

  function watch(value, cb) {
    const entity = checkCurrent('watch');

    if (typeof value !== 'function') {
      return () => {};
    }

    const stop = isValue(value) ? value.watch(cb) : computed(value).watch((v, s) => cb(v(), s));
    setHook('beforeDestroy', () => stop(), entity);
    return stop;
  }

  function useValue(fn, name = 'useValue') {
    const entity = checkCurrent(name);
    const index = entity.$_valueIndex++;
    const values = entity.$_values;

    if (!entity.created) {
      values[index] = undefined;
      const v = typeof fn === 'function' ? fn() : value(undefined);
      return values[index] = v;
    }

    if (index >= values.length) {
      throw new NeepError('Inconsistent number of useValue executions', 'life');
    }

    return values[index];
  }

  function hook(name, hook, initOnly) {
    const entity = checkCurrent('setHook');

    if (initOnly && entity.created) {
      return undefined;
    }

    return setHook(name, () => hook(), entity);
  }

  function setValue(obj, name, value, opt) {
    if (typeof name === 'string' && ['$', '_'].includes(name[0])) {
      return;
    }

    if (isValue(value) && opt) {
      Reflect.defineProperty(obj, name, {
        get() {
          return value();
        },

        set(v) {
          value(v);
        },

        configurable: true,
        enumerable: true
      });
      return;
    }

    if (typeof value === 'function' && opt) {
      Reflect.defineProperty(obj, name, {
        get: value,
        set: typeof opt === 'function' ? opt : undefined,
        configurable: true,
        enumerable: true
      });
      return;
    }

    Reflect.defineProperty(obj, name, {
      get() {
        return value;
      },

      configurable: true,
      enumerable: true
    });
  }

  function expose(name, value, opt) {
    setValue(checkCurrent('expose', true).exposed, name, value, opt);
  }

  function deliver(name, value, opt) {
    setValue(checkCurrent('deliver', true).delivered, name, value, opt);
  }

  var Life = /*#__PURE__*/Object.freeze({
    watch: watch,
    useValue: useValue,
    hook: hook,
    expose: expose,
    deliver: deliver
  });

  function isElement(v) {
    if (!v) {
      return false;
    }

    if (typeof v !== 'object') {
      return false;
    }

    return v[isElementSymbol] === true;
  }

  function createElement(tag, attrs, ...children) {
    attrs = attrs ? { ...attrs
    } : {};
    const node = {
      [isElementSymbol]: true,
      tag,
      children: []
    };

    if ('key' in attrs) {
      node.key = attrs.key;
    }

    if ('slot' in attrs) {
      node.slot = attrs.slot;
    }

    if (typeof attrs.ref === 'function') {
      node.ref = attrs.ref;
    }

    if (tag === Value) {
      node.value = attrs.value;
      return node;
    }

    node.children = children;

    if (tag === Template) {
      return node;
    }

    if (tag === SlotRender) {
      node.render = attrs.render;
      return node;
    }

    if (tag === ScopeSlot || tag === Slot) {
      const {
        render,
        argv,
        args,
        name
      } = attrs;
      node.render = render;
      node.args = argv && [argv] || Array.isArray(args) && args.length && args || [{}];

      if (tag === ScopeSlot) {
        node.props = {
          name
        };
        return node;
      }
    }

    node.props = {};

    for (let k in attrs) {
      node.props[k] = attrs[k];
    }

    return node;
  }

  function elements(node, opt = {}) {
    if (Array.isArray(node)) {
      const list = [];

      for (let n of node) {
        list.push(elements(n, opt));
      }

      return [].concat(...list);
    }

    if (!isElement(node)) {
      return [node];
    }

    let {
      tag
    } = node;

    if (!tag) {
      return [node];
    }

    if ([Template, ScopeSlot].includes(tag)) {
      return elements(node.children, opt);
    }

    if (typeof tag !== 'function') {
      return [node];
    }

    if (tag[typeSymbol] !== 'simple') {
      return [node];
    }

    const {
      simple
    } = opt;

    if (!simple) {
      return [node];
    }

    if (Array.isArray(simple)) {
      if (simple.includes(tag)) {
        return [node];
      }
    } else if (typeof simple === 'function') {
      if (!simple(tag)) {
        return [node];
      }
    }

    return elements(node.children, opt);
  }

  var Element$1 = /*#__PURE__*/Object.freeze({
    isElement: isElement,
    createElement: createElement,
    elements: elements
  });
  let label;

  function setLabel(l) {
    label = l;
  }

  function getLabel() {
    const l = label;
    label = undefined;
    return l;
  }

  function label$1(text, color = '') {
    {
      if (!current) {
        setLabel([text, color]);
        return;
      }

      Reflect.defineProperty(current.exposed, '$label', {
        value: [text, color],
        configurable: true
      });
    }
  }

  var Dev = /*#__PURE__*/Object.freeze({
    label: label$1
  });
  const auxiliary = { ...Tags,
    ...Life,
    ...Element$1,
    ...Dev,
    ...Constant,

    get value() {
      return value;
    },

    get computed() {
      return computed;
    },

    get isValue() {
      return isValue;
    },

    get encase() {
      return encase;
    },

    get recover() {
      return recover;
    }

  };

  let ids = 0;
  const Nodes = {};
  let IdMap;

  {
    IdMap = new Map();
  }

  function createMountedNode(n, id) {
    {
      id = id || ++ids;
      const {
        node
      } = n;

      if (node && IdMap) {
        IdMap.set(node, id);
      }

      return Nodes[id] = { ...n,
        id
      };
    }
  }

  function recoveryMountedNode(node) {
    {
      delete Nodes[node.id];
    }
  }

  function* recursive2iterable(list) {
    if (!Array.isArray(list)) {
      yield list;
      return;
    }

    for (const it of list) {
      yield* recursive2iterable(it);
    }
  }

  let refList;

  function setRefList(list) {
    refList = list;
  }

  function setRef(ref, node, isRemove) {
    if (typeof ref !== 'function') {
      return;
    }

    if (!node) {
      return;
    }

    if (!refList) {
      ref(node, isRemove);
    } else {
      refList.push(() => ref(node, isRemove));
    }
  }

  function getLastNode(tree) {
    if (Array.isArray(tree)) {
      return getLastNode(tree[tree.length - 1]);
    }

    const {
      component,
      children,
      node
    } = tree;

    if (node) {
      return node;
    }

    if (component) {
      return getLastNode(component.tree);
    }

    return getLastNode(children);
  }

  function getFirstNode(tree) {
    if (Array.isArray(tree)) {
      return getFirstNode(tree[0]);
    }

    const {
      component,
      children,
      node
    } = tree;

    if (node) {
      return node;
    }

    if (component) {
      return getFirstNode(component.tree);
    }

    return getFirstNode(children[0]);
  }

  function* getNodes(tree) {
    if (Array.isArray(tree)) {
      for (const it of tree) {
        yield* getNodes(it);
      }

      return;
    }

    const {
      children,
      node,
      component
    } = tree;

    if (node) {
      yield node;
      return;
    }

    if (component) {
      yield* getNodes(component.tree);
      return;
    }

    yield* getNodes(children);
  }

  function unmount(iRender, tree) {
    if (Array.isArray(tree)) {
      tree.forEach(e => unmount(iRender, e));
      return;
    }

    const {
      component,
      children,
      node,
      ref
    } = tree;
    recoveryMountedNode(tree);

    if (node) {
      setRef(ref, node, true);
      iRender.remove(node);
      return;
    }

    if (component) {
      setRef(ref, component.exposed, true);
      component.unmount();
      return;
    }

    unmount(iRender, children);
  }

  function replace(iRender, newTree, oldTree) {
    const next = getFirstNode(oldTree);

    if (!next) {
      return newTree;
    }

    const parent = iRender.parent(next);

    if (!parent) {
      return newTree;
    }

    for (const it of getNodes(newTree)) {
      iRender.insert(parent, it, next);
    }

    unmount(iRender, oldTree);
    return newTree;
  }

  function updateList(iRender, source, tree) {
    if (!source.length) {
      const node = createItem(iRender, {
        tag: null,
        children: []
      });
      return [replace(iRender, node, tree)];
    }

    if (!Array.isArray(tree)) {
      tree = [tree];
    }

    const newList = [];
    const list = [...tree];
    const mountedMap = new Map();

    for (const src of source) {
      const index = list.findIndex(it => it.tag === src.tag && it.key === src.key);

      if (index >= 0) {
        const old = list[index];
        const item = updateItem(iRender, src, old);
        mountedMap.set(old, item);
        newList.push(item);
        list.splice(index, 1);
      } else {
        const item = createItem(iRender, src);
        newList.push(item);
      }
    }

    if (!mountedMap.size) {
      return replace(iRender, newList, list);
    }

    unmount(iRender, list);
    tree = tree.filter(t => mountedMap.has(t));
    const last = getLastNode(tree[tree.length - 1]);
    const parent = iRender.parent(last);

    if (!parent) {
      return newList;
    }

    let next = iRender.next(last);

    for (let i = newList.length - 1; i >= 0; i--) {
      const item = newList[i];
      const index = tree.findIndex(o => mountedMap.get(o) === item);

      if (index >= 0) {
        for (const it of tree.splice(index)) {
          mountedMap.delete(it);
        }
      } else {
        for (const it of getNodes(item)) {
          iRender.insert(parent, it, next);
        }
      }

      next = getFirstNode(item) || next;
    }

    return newList;
  }

  function updateAll(iRender, source, tree) {
    let index = 0;
    let length = Math.min(source.length, source.length || 1);
    const list = [];

    for (; index < length; index++) {
      const src = source[index];

      if (Array.isArray(src)) {
        list.push(updateList(iRender, src, tree[index]));
      } else {
        list.push(updateItem(iRender, src, tree[index]));
      }
    }

    length = Math.max(source.length, tree.length);

    if (tree.length > length) {
      for (; index < length; index++) {
        unmount(iRender, tree[index]);
      }
    }

    if (source.length > length) {
      const last = getLastNode(list[list.length - 1]);
      const parent = iRender.parent(last);
      const next = iRender.next(last);

      for (; index < length; index++) {
        const src = source[index];
        const item = Array.isArray(src) ? createList(iRender, src) : createItem(iRender, src);
        list.push(item);

        if (!parent) {
          continue;
        }

        for (const it of getNodes(item)) {
          iRender.insert(parent, it, next);
        }
      }
    }

    return list;
  }

  function updateItem(iRender, source, tree) {
    if (Array.isArray(tree)) {
      const index = tree.findIndex(it => it.tag === source.tag && it.component === source.component);

      if (index < 0) {
        return replace(iRender, createItem(iRender, source), tree);
      }

      const all = tree;
      [tree] = tree.splice(index, 1);
      unmount(iRender, all);
    }

    const {
      tag,
      component
    } = source;
    const ref = source.ref !== tree.ref && source.ref || undefined;

    if (tag !== tree.tag || component !== tree.component) {
      return replace(iRender, createItem(iRender, source), tree);
    }

    if (!tag) {
      return tree;
    }

    const ltag = typeof tag !== 'string' ? '' : tag.toLowerCase();

    if (typeof tag !== 'string' || ltag === 'neep:container') {
      if (!component) {
        return createMountedNode({ ...source,
          node: undefined,
          component: undefined,
          children: draw(iRender, source.children, tree.children)
        }, tree.id);
      }

      setRef(ref, component.exposed);
      return createMountedNode({ ...source,
        node: undefined,
        component,
        children: []
      }, tree.id);
    }

    if (ltag === 'neep:value') {
      let value = source.value;

      if (isValue(value)) {
        value = value();
      }

      if (tree.value === value) {
        setRef(ref, tree.node);
        return createMountedNode({ ...tree,
          ...source,
          value,
          children: []
        }, tree.id);
      }

      return replace(iRender, createValue$2(iRender, source, value), tree);
    }

    if (ltag.substr(0, 5) === 'neep:' || ltag === 'template') {
      return createMountedNode({ ...source,
        node: undefined,
        component: undefined,
        children: updateAll(iRender, source.children, tree.children)
      }, tree.id);
    }

    const {
      node
    } = tree;
    iRender.update(node, source.props || {});
    setRef(ref, node);

    if (!source.children.length && !tree.children.length) {
      return createMountedNode({ ...tree,
        ...source,
        children: []
      }, tree.id);
    }

    if (!source.children.length && tree.children.length) {
      unmount(iRender, tree.children);
    }

    if (source.children.length && !tree.children.length) {
      const children = createAll(iRender, source.children);

      for (const it of getNodes(children)) {
        iRender.insert(node, it);
      }

      return createMountedNode({ ...tree,
        ...source,
        children
      }, tree.id);
    }

    return createMountedNode({ ...tree,
      ...source,
      children: updateAll(iRender, source.children, tree.children)
    }, tree.id);
  }

  function createValue$2(iRender, source, value) {
    let {
      ref
    } = source;

    if (iRender.isNode(value)) {
      setRef(ref, value);
      return createMountedNode({ ...source,
        value,
        node: value,
        children: [],
        component: undefined
      });
    }

    const type = typeof value;
    let node;

    if (type === 'bigint' || type === 'boolean' || type === 'number' || type === 'string' || type === 'symbol' || value instanceof RegExp) {
      node = iRender.text(String(value));
    } else if (value instanceof Date) {
      node = iRender.text(value.toISOString());
    } else if (type === 'object' && value) {
      node = iRender.text(String(value));
    }

    if (!node) {
      node = iRender.placeholder();
    }

    setRef(ref, node);
    return createMountedNode({ ...source,
      value,
      node,
      component: undefined,
      children: []
    });
  }

  function createAll(iRender, source) {
    if (!source.length) {
      return [createMountedNode({
        tag: null,
        node: iRender.placeholder(),
        component: undefined,
        children: []
      })];
    }

    return source.map(item => Array.isArray(item) ? createList(iRender, item) : createItem(iRender, item));
  }

  function createList(iRender, source) {
    if (source.length) {
      return source.map(it => createItem(iRender, it));
    }

    return [createMountedNode({
      tag: null,
      node: iRender.placeholder(),
      component: undefined,
      children: []
    })];
  }

  function createItem(iRender, source) {
    var _source$children;

    const {
      tag,
      ref,
      component
    } = source;

    if (!tag) {
      const node = iRender.placeholder();
      setRef(ref, node);
      return createMountedNode({
        tag: null,
        node,
        component: undefined,
        children: []
      });
    }

    const ltag = typeof tag !== 'string' ? '' : tag.toLowerCase();

    if (typeof tag !== 'string' || ltag === 'neep:container') {
      if (!component) {
        return createMountedNode({ ...source,
          node: undefined,
          component: undefined,
          children: draw(iRender, source.children)
        });
      }

      component.mount();
      setRef(ref, component.exposed);
      return createMountedNode({ ...source,
        node: undefined,
        component,
        children: []
      });
    }

    if (ltag === 'neep:value') {
      let value = source.value;

      if (isValue(value)) {
        value = value();
      }

      return createValue$2(iRender, source, value);
    }

    if (ltag.substr(0, 5) === 'neep:' || ltag === 'template') {
      return createMountedNode({ ...source,
        node: undefined,
        component: undefined,
        children: createAll(iRender, source.children)
      });
    }

    const node = iRender.create(tag, source.props || {});
    setRef(ref, node);
    let children = [];

    if ((_source$children = source.children) === null || _source$children === void 0 ? void 0 : _source$children.length) {
      children = createAll(iRender, source.children);

      for (const it of getNodes(children)) {
        iRender.insert(node, it);
      }
    }

    return createMountedNode({ ...source,
      node,
      component: undefined,
      children
    });
  }

  function draw(iRender, source, tree) {
    if (tree) {
      return updateAll(iRender, source, tree);
    }

    return createAll(iRender, source);
  }

  function getSlots(iRender, children, slots, native = false) {
    const nativeList = [];

    for (const it of children) {
      if (Array.isArray(it)) {
        const list = Object.create(null);
        nativeList.push(getSlots(iRender, it, list, native));

        for (const k of Reflect.ownKeys(list)) {
          if (k in slots) {
            slots[k].push(list[k]);
          } else {
            slots[k] = [list[k]];
          }
        }

        continue;
      }

      if (native) {
        if (iRender.isNode(it)) {
          nativeList.push(it);
          continue;
        }

        if (!isElement(it)) {
          nativeList.push(it);
          continue;
        }

        if (it.tag !== SlotRender) {
          nativeList.push(it);
          continue;
        }
      }

      const slot = isElement(it) && it.slot || 'default';
      const el = isElement(it) ? { ...it,
        slot: undefined,
        props: { ...it.props,
          slot: undefined
        }
      } : it;

      if (slot in slots) {
        slots[slot].push(el);
      } else {
        slots[slot] = [el];
      }
    }

    return nativeList;
  }

  function renderSlots(list, ...props) {
    return list.map(it => {
      if (Array.isArray(it)) {
        return renderSlots(it, ...props);
      }

      if (!isElement(it)) {
        return it;
      }

      if (it.tag !== SlotRender) {
        return { ...it,
          slot: undefined
        };
      }

      if (typeof it.render === 'function') {
        return it.render(...props);
      }

      return it.children;
    });
  }

  function createSlots(name, list) {
    const slot = (...props) => ({
      [isElementSymbol]: true,
      tag: ScopeSlot,
      children: renderSlots(list, ...props),
      inserted: true,
      label:  [`[${name}]`, '#00F']
    });

    slot.children = list;
    return slot;
  }

  function setSlots(children, slots = Object.create(null)) {
    for (const k of Reflect.ownKeys(slots)) {
      if (!(k in children)) {
        delete slots[k];
      }
    }

    for (const k of Reflect.ownKeys(children)) {
      slots[k] = createSlots(k, children[k]);
    }

    return slots;
  }

  const disabledKey = new Set([':', '@', '#', '*', '!', '%', '^', '~', '&', '=', '+', '.', '(', ')', '[', ']', '{', '}', '<', '>']);

  function filter(k) {
    if (typeof k !== 'string') {
      return true;
    }

    if (disabledKey.has(k[0])) {
      return false;
    }

    if (/^n[:-]/.test(k)) {
      return false;
    }

    if (/^on[:-]/.test(k)) {
      return false;
    }

    return true;
  }

  function updateProps(obj, props, oldProps = {}, define = false, isProps = false) {
    const keys = Reflect.ownKeys(props);
    const newKeys = new Set(isProps ? keys.filter(filter) : keys);

    for (const k of Reflect.ownKeys(obj)) {
      if (!newKeys.has(k)) {
        delete obj[k];
      }
    }

    if (!define) {
      for (const k of newKeys) {
        obj[k] = props[k];
      }

      return obj;
    }

    for (const k of newKeys) {
      const value = props[k];

      if (k in oldProps && oldProps[k] === value) {
        continue;
      }

      if (isValue(value)) {
        Reflect.defineProperty(obj, k, {
          configurable: true,
          enumerable: true,

          get() {
            return value();
          },

          set(v) {
            value(v);
          }

        });
        continue;
      }

      Reflect.defineProperty(obj, k, {
        configurable: true,
        enumerable: true,
        value
      });
    }

    return obj;
  }

  function getComponents(...components) {
    return components.filter(Boolean);
  }

  function execSimple(nObject, delivered, node, tag, components, children) {
    const {
      iRender
    } = nObject;
    const slotMap = Object.create(null);
    getSlots(iRender, children, slotMap);
    const slots = setSlots(slotMap);
    const event = new EventEmitter();
    event.updateInProps(node.props);
    const props = { ...node.props
    };
    const context = initContext({
      slots,
      created: false,
      parent: nObject.exposed,
      delivered,
      children: new Set(),
      childNodes: children,

      refresh(f) {
        nObject.refresh(f);
      },

      emit: event.emit,
      valueifyProp: valueify(props)
    });

    {
      getLabel();
    }

    const result = tag(props, context, auxiliary);
    let label;

    {
      label = getLabel();
    }

    const nodes = exec$1(nObject, delivered, renderNode(iRender, result, context, tag[renderSymbol]), slots, getComponents(...components, tag[componentsSymbol]));
    return { ...node,
      tag,
      children: Array.isArray(nodes) ? nodes : [nodes],
      label
    };
  }

  function execSlot(nObject, delivered, node, slots, components, children, args = [{}], native) {
    var _node$props;

    const slotName = ((_node$props = node.props) === null || _node$props === void 0 ? void 0 : _node$props.name) || 'default';
    const slot = slots[slotName];

    if (typeof slot === 'function') {
      return { ...node,
        ...slot(...args)
      };
    }

    const {
      render
    } = node;
    const label =  [`[${slotName}]`, '#00F'];
    return { ...node,
      tag: ScopeSlot,
      label,
      children: exec$1(nObject, delivered, typeof render !== 'function' ? children : render(...args), slots, components, native)
    };
  }

  function findComponent(tag, components$1) {
    if (!tag) {
      return null;
    }

    if (typeof tag !== 'string') {
      return tag;
    }

    if (tag === 'template') {
      return tag;
    }

    if (/^neep:.+/i.test(tag)) {
      return tag;
    }

    for (const list of components$1) {
      const component = list[tag];

      if (component) {
        return component;
      }
    }

    return components[tag] || tag;
  }

  function exec$1(nObject, delivered, node, slots, components, native = false) {
    if (Array.isArray(node)) {
      return node.map(n => exec$1(nObject, delivered, n, slots, components, native));
    }

    if (!isElement(node)) {
      return node;
    }

    const {
      inserted,
      args = [{}]
    } = node;
    let tag = findComponent(node.tag, components);

    if (tag === Deliver) {
      const props = { ...node.props
      };
      delete props.ref;
      delete props.slot;
      delete props.key;
      const newDelivered = Object.create(delivered);
      updateProps(newDelivered, props || {}, {}, true);
      return { ...node,
        tag,
        $__neep__delivered: newDelivered,
        children: node.children.map(n => exec$1(nObject, newDelivered, n, slots, components, native))
      };
    }

    const children = node.children.map(n => exec$1(nObject, delivered, n, slots, components, native));

    if (typeof tag === 'function') {
      if (tag[typeSymbol] === 'simple') {
        return execSimple(nObject, delivered, node, tag, components, exec$1(nObject, delivered, children, slots, components, native));
      }

      return { ...node,
        $__neep__delivered: delivered,
        children,
        tag
      };
    }

    if (tag === Slot) {
      tag = native ? 'slot' : ScopeSlot;
    }

    if (tag !== ScopeSlot || inserted) {
      return { ...node,
        children,
        tag
      };
    }

    return execSlot(nObject, delivered, { ...node,
      tag
    }, slots, components, children, args, native);
  }

  function renderNode(iRender, node, context, render) {
    if (Array.isArray(node)) {
      return node;
    }

    if (isElement(node)) {
      return [node];
    }

    if (node === undefined || node === null) {
      return [{
        [isElementSymbol]: true,
        tag: null,
        children: []
      }];
    }

    if (!iRender.isNode(node) && node && typeof node === 'object' && render) {
      node = render(node, context, auxiliary);
    }

    if (isElement(node)) {
      return [node];
    }

    if (node === undefined || node === null) {
      return [{
        [isElementSymbol]: true,
        tag: null,
        children: []
      }];
    }

    return [{
      [isElementSymbol]: true,
      tag: Value,
      value: node,
      children: []
    }];
  }

  function normalize(nObject, result) {
    const {
      component
    } = nObject;
    return exec$1(nObject, nObject.delivered, renderNode(nObject.iRender, result, nObject.context, component[renderSymbol]), nObject.context.slots, getComponents(component[componentsSymbol]), Boolean(nObject.native));
  }

  let delayedRefresh = 0;
  const objectSet = new Set();

  function wait$1(obj) {
    if (delayedRefresh <= 0) {
      return false;
    }

    objectSet.add(obj);
    return true;
  }

  function run$2() {
    if (delayedRefresh > 0) {
      return;
    }

    const list = [...objectSet];
    objectSet.clear();
    list.forEach(o => o.refresh());
  }

  async function asyncRefresh(f) {
    try {
      delayedRefresh++;
      return await f();
    } finally {
      delayedRefresh--;
      run$2();
    }
  }

  function refresh(f, async) {
    if (async) {
      return asyncRefresh(f);
    }

    try {
      delayedRefresh++;
      return f();
    } finally {
      delayedRefresh--;
      run$2();
    }
  }

  function createExposed(obj) {
    const cfg = {
      $parent: {
        configurable: true,
        get: () => {
          var _obj$parent;

          return (_obj$parent = obj.parent) === null || _obj$parent === void 0 ? void 0 : _obj$parent.exposed;
        }
      },
      $component: {
        configurable: true,
        value: null
      },
      $isContainer: {
        configurable: true,
        value: false
      },
      $created: {
        configurable: true,
        get: () => obj.created
      },
      $destroyed: {
        configurable: true,
        get: () => obj.destroyed
      },
      $mounted: {
        configurable: true,
        get: () => obj.mounted
      },
      $unmounted: {
        configurable: true,
        get: () => obj.unmounted
      }
    };
    const exposed = Object.create(null, cfg);
    return exposed;
  }

  let completeList;

  function setCompleteList(list) {
    completeList = list;
  }

  function complete(it) {
    if (!completeList) {
      it();
    } else {
      completeList.push(it);
    }
  }

  function createEntity(obj) {
    const cfg = {
      exposed: {
        configurable: true,
        get: () => obj.exposed
      },
      delivered: {
        configurable: true,
        get: () => obj.delivered
      },
      parent: {
        configurable: true,
        get: () => {
          var _obj$parent2;

          return (_obj$parent2 = obj.parent) === null || _obj$parent2 === void 0 ? void 0 : _obj$parent2.entity;
        }
      },
      component: {
        configurable: true,
        value: null
      },
      isContainer: {
        configurable: true,
        value: false
      },
      created: {
        configurable: true,
        get: () => obj.created
      },
      destroyed: {
        configurable: true,
        get: () => obj.destroyed
      },
      mounted: {
        configurable: true,
        get: () => obj.mounted
      },
      unmounted: {
        configurable: true,
        get: () => obj.unmounted
      },
      $_hooks: {
        configurable: true,
        value: Object.create(null)
      },
      $_valueIndex: {
        configurable: true,
        value: 0,
        writable: true
      },
      $_values: {
        configurable: true,
        value: []
      },
      callHook: {
        configurable: true,

        value(h) {
          callHook(h, entity);
        }

      },
      setHook: {
        configurable: true,

        value(id, hook) {
          return setHook(id, hook, entity);
        }

      },
      refresh: {
        configurable: true,
        value: obj.refresh.bind(obj)
      },
      on: {
        configurable: true,
        value: obj.on
      },
      emit: {
        configurable: true,
        value: obj.emit
      },
      config: {
        configurable: true,
        value: obj.config
      }
    };
    const entity = Object.create(null, cfg);
    return entity;
  }

  class NeepObject {
    constructor(iRender, parent, delivered = (parent === null || parent === void 0 ? void 0 : parent.delivered) || Object.create(null), container) {
      _defineProperty(this, "events", new EventEmitter());

      _defineProperty(this, "emit", this.events.emit);

      _defineProperty(this, "on", this.events.on);

      _defineProperty(this, "eventCancelHandles", new Set());

      _defineProperty(this, "iRender", void 0);

      _defineProperty(this, "components", Object.create(null));

      _defineProperty(this, "config", Object.create(null));

      _defineProperty(this, "parentDelivered", void 0);

      _defineProperty(this, "delivered", void 0);

      _defineProperty(this, "exposed", createExposed(this));

      _defineProperty(this, "entity", createEntity(this));

      _defineProperty(this, "parent", void 0);

      _defineProperty(this, "native", void 0);

      _defineProperty(this, "created", false);

      _defineProperty(this, "destroyed", false);

      _defineProperty(this, "mounted", false);

      _defineProperty(this, "unmounted", false);

      _defineProperty(this, "children", new Set());

      _defineProperty(this, "tree", []);

      _defineProperty(this, "container", void 0);

      _defineProperty(this, "_render", () => []);

      _defineProperty(this, "_needRefresh", false);

      _defineProperty(this, "_delayedRefresh", 0);

      _defineProperty(this, "_refreshing", false);

      _defineProperty(this, "_nodes", []);

      _defineProperty(this, "childNodes", []);

      _defineProperty(this, "__executed_destroy", false);

      _defineProperty(this, "__executed_mount", false);

      _defineProperty(this, "__executed_mounted", false);

      _defineProperty(this, "_cancelDrawMonitor", void 0);

      this.iRender = iRender;
      this.parentDelivered = delivered;
      this.delivered = Object.create(delivered);

      if (parent) {
        this.parent = parent;
      }

      this.container = container || this;
    }

    get canRefresh() {
      if (wait$1(this)) {
        return false;
      }

      return !this._delayedRefresh;
    }

    get needRefresh() {
      if (wait$1(this)) {
        return false;
      }

      if (this._delayedRefresh) {
        return false;
      }

      const needRefresh = this._needRefresh;
      this._needRefresh = false;
      return needRefresh;
    }

    requestDraw() {}

    async asyncRefresh(f) {
      try {
        this._delayedRefresh++;
        return await f();
      } finally {
        this._delayedRefresh--;
        this.refresh();
      }
    }

    refresh(f, async) {
      if (typeof f === 'function') {
        if (async) {
          return this.asyncRefresh(f);
        }

        try {
          this._delayedRefresh++;
          return f();
        } finally {
          this._delayedRefresh--;

          if (this._delayedRefresh <= 0) {
            this.refresh();
          }
        }
      }

      if (this.destroyed) {
        return;
      }

      this._needRefresh = true;

      if (!this.created) {
        return;
      }

      if (this._refreshing) {
        return;
      }

      this._refreshing = true;
      let nodes;

      while (this.needRefresh) {
        nodes = this._render();

        if (this.destroyed) {
          return;
        }
      }

      this._refreshing = false;

      if (!this.canRefresh) {
        return;
      }

      if (!nodes) {
        return;
      }

      this._nodes = convert(this, nodes, this._nodes);

      if (!this.mounted) {
        return;
      }

      if (this.destroyed) {
        return;
      }

      if (this.unmounted) {
        return;
      }

      this.requestDraw();
    }

    callHook(id) {
      callHook(id, this.entity);
    }

    _update(props, children) {
      this.childNodes = children;
    }

    update(props, children) {
      this._update(props, children);
    }

    _destroy() {}

    destroy() {
      if (this.__executed_destroy) {
        return;
      }

      this.__executed_destroy = true;
      this.callHook('beforeDestroy');

      this._destroy();

      this.callHook('destroyed');
      this.destroyed = true;
    }

    _mount() {}

    mount() {
      if (this.__executed_destroy) {
        return;
      }

      if (this.__executed_mount) {
        return;
      }

      this.__executed_mount = true;
      this.callHook('beforeMount');
      const result = exec(c => c && this.requestDraw(), () => {
        this._mount();

        this.mounted = true;
      });
      this._cancelDrawMonitor = result.stop;
      complete(() => this.callHook('mounted'));
    }

    _unmount() {}

    unmount() {
      if (!this.mounted) {
        return;
      }

      if (this.__executed_mounted) {
        return;
      }

      this.__executed_mounted = true;
      this.callHook('beforeUnmount');

      this._unmount();

      this.callHook('unmounted');
      this.unmounted = true;
    }

    _draw() {}

    draw() {
      var _this$_cancelDrawMoni;

      if (this.__executed_destroy) {
        return;
      }

      (_this$_cancelDrawMoni = this._cancelDrawMonitor) === null || _this$_cancelDrawMoni === void 0 ? void 0 : _this$_cancelDrawMoni.call(this);
      this.callHook('beforeUpdate');
      const result = exec(c => c && this.requestDraw(), () => this._draw());
      this._cancelDrawMonitor = result.stop;
      complete(() => this.callHook('updated'));
    }

  }

  function update(nObject, props, children) {
    updateProps(nObject.props, props, {}, false, true);
    nObject.events.updateInProps(props);
    const slots = Object.create(null);
    const {
      native
    } = nObject;
    const childNodes = getSlots(nObject.iRender, children, slots, Boolean(native));
    setSlots(slots, nObject.slots);

    if (!native) {
      return;
    }

    nObject.nativeNodes = convert(nObject, childNodes, nObject.nativeNodes);

    if (!nObject.mounted) {
      return;
    }

    nObject.requestDraw();
  }

  function createContext(nObject) {
    return initContext({
      slots: nObject.slots,

      get created() {
        return nObject.created;
      },

      get parent() {
        return nObject.parent.exposed;
      },

      get delivered() {
        return nObject.parentDelivered;
      },

      get children() {
        return nObject.children;
      },

      get childNodes() {
        return nObject.childNodes;
      },

      get emit() {
        return nObject.emit;
      },

      refresh(f) {
        nObject.refresh(f);
      },

      valueifyProp: valueify(nObject.props)
    }, nObject.exposed);
  }

  function initRender(nObject) {
    const {
      component,
      props,
      context,
      entity
    } = nObject;

    const refresh = changed => changed && nObject.refresh();

    const result = exec(refresh, () => setCurrent(() => component(props, context, auxiliary), entity), {
      resultOnly: true
    });

    if (typeof result === 'function') {
      const render = createExecutable(refresh, () => normalize(nObject, result()));
      return {
        nodes: render(),
        render,
        stopRender: () => render.stop()
      };
    }

    const render = createExecutable(refresh, () => normalize(nObject, setCurrent(() => component(props, context, auxiliary), entity)));
    return {
      nodes: exec(refresh, () => normalize(nObject, result), {
        resultOnly: true
      }),
      render,
      stopRender: () => render.stop()
    };
  }

  class Entity extends NeepObject {
    constructor(component, props, children, parent, delivered) {
      var _this$iRender$compone, _this$iRender;

      super(parent.iRender, parent, delivered, parent.container);

      _defineProperty(this, "component", void 0);

      _defineProperty(this, "props", encase(Object.create(null)));

      _defineProperty(this, "slots", encase(Object.create(null)));

      _defineProperty(this, "_stopRender", void 0);

      _defineProperty(this, "nativeNodes", void 0);

      _defineProperty(this, "shadowTree", []);

      _defineProperty(this, "nativeTree", []);

      _defineProperty(this, "_shadow", void 0);

      _defineProperty(this, "context", void 0);

      _defineProperty(this, "parent", void 0);

      this.component = component;
      Object.assign(this.config, component[configSymbol]);
      Object.assign(this.components, component[componentsSymbol]);
      Reflect.defineProperty(this.exposed, '$component', {
        value: component,
        enumerable: true,
        configurable: true
      });
      [this.native, this._shadow] = component[typeSymbol] === 'native' && ((_this$iRender$compone = (_this$iRender = this.iRender).component) === null || _this$iRender$compone === void 0 ? void 0 : _this$iRender$compone.call(_this$iRender)) || [];
      this.parent = parent;
      parent.children.add(this.exposed);
      const context = createContext(this);
      this.context = context;
      this.callHook('beforeCreate');
      this.childNodes = children;
      refresh(() => update(this, props, children));
      const {
        render,
        nodes,
        stopRender
      } = initRender(this);
      this._render = render;
      this._stopRender = stopRender;
      this._nodes = convert(this, nodes);
      this.callHook('created');
      this.created = true;

      if (this._needRefresh) {
        this.refresh();
      }
    }

    _update(props, children) {
      if (this.destroyed) {
        return;
      }

      this.childNodes = children;
      refresh(() => update(this, props, children));
    }

    _destroy() {
      if (this._stopRender) {
        this._stopRender();
      }

      this.parent.children.delete(this.exposed);
      destroy(this._nodes);
    }

    requestDraw() {
      this.container.markDraw(this);
    }

    _draw() {
      const {
        nativeNodes,
        iRender,
        _shadow,
        native
      } = this;

      if (!native || !nativeNodes || !_shadow) {
        this.tree = draw(iRender, this._nodes, this.tree);
        return;
      }

      this.shadowTree = draw(iRender, this._nodes, this.shadowTree);
      this.nativeTree = draw(iRender, nativeNodes, this.nativeTree);
    }

    _mount() {
      const {
        nativeNodes,
        iRender,
        _shadow,
        native,
        _nodes
      } = this;

      if (!native || !nativeNodes || !_shadow) {
        this.tree = draw(iRender, _nodes);
        return;
      }

      this.tree = draw(iRender, convert(this, native));
      this.shadowTree = draw(iRender, _nodes);

      for (const it of getNodes(this.shadowTree)) {
        iRender.insert(_shadow, it);
      }

      this.nativeTree = draw(iRender, nativeNodes);

      for (const it of getNodes(this.nativeTree)) {
        iRender.insert(native, it);
      }
    }

    _unmount() {
      const {
        iRender,
        nativeTree
      } = this;
      unmount(iRender, this.tree);

      if (!nativeTree) {
        return;
      }

      unmount(iRender, nativeTree);
    }

  }

  function toElement(t) {
    if (t === false || t === null || t === undefined) {
      return null;
    }

    if (isElement(t)) {
      return t;
    }

    return {
      [isElementSymbol]: true,
      tag: 'Neep:Value',
      key: t,
      value: t,
      children: []
    };
  }

  function destroy(tree) {
    if (Array.isArray(tree)) {
      tree.forEach(t => destroy(t));
      return;
    }

    const {
      component
    } = tree;

    if (component) {
      component.destroy();
    }
  }

  function createItem$1(nObject, source) {
    if (!source) {
      return {
        tag: null,
        children: []
      };
    }

    const {
      tag
    } = source;

    if (!tag) {
      return {
        tag: null,
        children: []
      };
    }

    if (typeof tag !== 'string') {
      if (tag[typeSymbol] === 'simple') {
        return { ...source,
          children: convert(nObject, source.children),
          component: undefined
        };
      }

      return { ...source,
        children: [],
        component: new Entity(tag, source.props || {}, source.children, nObject, source.$__neep__delivered)
      };
    }

    const ltag = tag.toLowerCase();

    if (ltag === 'neep:container') {
      var _source$props;

      const type = source === null || source === void 0 ? void 0 : (_source$props = source.props) === null || _source$props === void 0 ? void 0 : _source$props.type;
      const iRender = type ? getRender(type) : nObject.iRender;
      return { ...source,
        children: [],
        component: new Container$1(iRender, source.props || {}, source.children, nObject, source.$__neep__delivered)
      };
    }

    if (ltag === 'neep:value') {
      return { ...source,
        children: []
      };
    }

    if (ltag.substr(0, 5) === 'neep:' || ltag === 'template') {
      return { ...source,
        children: convert(nObject, source.children)
      };
    }

    return { ...source,
      children: convert(nObject, source.children)
    };
  }

  function updateList$1(nObject, source, tree) {
    if (!Array.isArray(tree)) {
      tree = [tree];
    }

    const newList = [];

    for (const src of recursive2iterable(source)) {
      const node = toElement(src);

      if (!node) {
        continue;
      }

      const index = tree.findIndex(it => it.tag === node.tag && it.key === node.key);

      if (index >= 0) {
        newList.push(updateItem$1(nObject, node, tree[index]));
        tree.splice(index, 1);
      } else {
        newList.push(createItem$1(nObject, node));
      }
    }

    destroy(tree);
    return newList;
  }

  function updateItem$1(nObject, source, tree) {
    if (!tree) {
      return createItem$1(nObject, source);
    }

    if (!source) {
      destroy(tree);
      return {
        tag: null,
        children: []
      };
    }

    if (Array.isArray(tree)) {
      if (!tree.length) {
        return createItem$1(nObject, source);
      }

      const index = tree.findIndex(it => it.tag === source.tag);

      if (index < 0) {
        destroy(tree);
        return createItem$1(nObject, source);
      }

      const all = tree;
      [tree] = tree.splice(index, 1);
      destroy(all);
    }

    const {
      tag
    } = source;

    if (tag !== tree.tag) {
      destroy(tree);
      return createItem$1(nObject, source);
    }

    if (!tag) {
      return {
        tag: null,
        children: []
      };
    }

    if (typeof tag !== 'string') {
      if (tag[typeSymbol] === 'simple') {
        return { ...source,
          children: convert(nObject, source.children, tree.children),
          component: undefined
        };
      }

      const {
        component
      } = tree;

      if (!component) {
        return createItem$1(nObject, source);
      }

      component.update(source.props || {}, source.children);
      return { ...source,
        children: [],
        component
      };
    }

    const ltag = tag.toLowerCase();

    if (ltag === 'neep:container') {
      var _source$props2;

      const {
        component
      } = tree;

      if (!component) {
        return createItem$1(nObject, source);
      }

      const type = source === null || source === void 0 ? void 0 : (_source$props2 = source.props) === null || _source$props2 === void 0 ? void 0 : _source$props2.type;
      const iRender = type ? getRender(type) : nObject.iRender;

      if (iRender !== component.iRender) {
        return createItem$1(nObject, source);
      }

      component.update(source.props || {}, source.children);
      return { ...source,
        children: [],
        component
      };
    }

    if (ltag === 'neep:value') {
      return { ...source,
        children: []
      };
    }

    if (ltag.substr(0, 5) === 'neep:' || ltag === 'template') {
      let delivered;

      if (ltag === 'neep:deliver') {
        const props = { ...source.props
        };
        delete props.ref;
        delete props.slot;
        delete props.key;
        delivered = updateProps(tree.$__neep__delivered, props, tree.props, true);
      }

      return { ...source,
        $__neep__delivered: delivered,
        children: convert(nObject, source.children, tree.children)
      };
    }

    return { ...source,
      children: convert(nObject, source.children, tree.children)
    };
  }

  function createAll$1(nObject, source) {
    if (!source.length) {
      return [];
    }

    return source.map(item => {
      if (!Array.isArray(item)) {
        return createItem$1(nObject, toElement(item));
      }

      return [...recursive2iterable(item)].map(it => createItem$1(nObject, toElement(it)));
    });
  }

  function* updateAll$1(nObject, source, tree) {
    let index = 0;
    let length = Math.min(source.length, source.length);

    for (; index < length; index++) {
      const src = source[index];

      if (Array.isArray(src)) {
        yield updateList$1(nObject, src, tree[index]);
      } else {
        yield updateItem$1(nObject, toElement(src), tree[index]);
      }
    }

    length = Math.max(source.length, source.length);

    if (tree.length > length) {
      for (; index < length; index++) {
        destroy(tree[index]);
      }
    }

    if (source.length > length) {
      for (; index < length; index++) {
        const src = toElement(source[index]);

        if (Array.isArray(src)) {
          yield [...recursive2iterable(src)].map(it => createItem$1(nObject, it));
        } else {
          yield createItem$1(nObject, src);
        }
      }
    }
  }

  function convert(nObject, source, tree) {
    if (!Array.isArray(source)) {
      source = [source];
    }

    if (!tree) {
      return createAll$1(nObject, source);
    }

    return [...updateAll$1(nObject, source, tree)];
  }

  let awaitDraw = new Set();
  let requested = false;

  function markDraw(c) {
    awaitDraw.add(c);

    if (requested) {
      return;
    }

    requested = true;
    nextFrame(() => {
      requested = false;
      const list = [...awaitDraw];
      awaitDraw.clear();
      list.map(c => c.drawAll());
    });
  }

  class Container$1 extends NeepObject {
    constructor(iRender, props, children, parent, delivered) {
      super(iRender, parent, delivered);

      _defineProperty(this, "props", void 0);

      _defineProperty(this, "content", []);

      _defineProperty(this, "_node", null);

      _defineProperty(this, "_container", null);

      _defineProperty(this, "rootContainer", this);

      _defineProperty(this, "_drawChildren", false);

      _defineProperty(this, "_drawContainer", false);

      _defineProperty(this, "_awaitDraw", new Set());

      _defineProperty(this, "_needDraw", false);

      _defineProperty(this, "_containers", new Set());

      this.props = props;
      this.parent = parent;

      if (parent) {
        this.rootContainer = parent.container.rootContainer;
      }

      this.callHook('beforeCreate');

      this._render = () => children;

      this._nodes = convert(this, children);
      this.callHook('created');
      this.created = true;
    }

    setChildren(children) {
      if (this.destroyed) {
        return;
      }

      this.childNodes = children;

      this._render = () => children;

      this._drawChildren = true;
      this.refresh();
    }

    setProps(props) {
      if (this.destroyed) {
        return;
      }

      this.props = props;
      this._drawContainer = true;
      this.refresh();
    }

    update(props, children) {
      this.refresh(() => {
        this.setProps(props);
        this.setChildren(children);
      });
    }

    requestDraw() {
      this.markDraw(this);
    }

    _mount() {
      const {
        props,
        parent,
        iRender
      } = this;
      const content = draw(this.container.iRender, this._nodes);
      this.content = content;
      const [container, node] = iRender.mount(props, parent === null || parent === void 0 ? void 0 : parent.iRender);

      for (const it of getNodes(content)) {
        iRender.insert(container, it);
      }

      this.tree = [createMountedNode({
        tag: Value,
        component: undefined,
        node,
        value: node,
        children: []
      })];
      this._node = node;
      this._container = container;
    }

    _destroy() {
      destroy(this.content);
    }

    _unmount() {
      const {
        parent,
        iRender
      } = this;

      if (parent) {
        unmount(parent.iRender, this.tree);
      }

      iRender.unmount(this._container, this._node, Boolean(parent));
      unmount(this.iRender, this.content);
    }

    _draw() {
      const {
        _drawChildren: drawChildren,
        _drawContainer: drawContainer
      } = this;
      this._drawContainer = false;

      if (drawContainer) {
        var _this$parent;

        this.iRender.drawContainer(this._container, this._node, this.props, (_this$parent = this.parent) === null || _this$parent === void 0 ? void 0 : _this$parent.iRender);
      }

      if (this.parent && this.parent.iRender !== this.iRender) {
        return;
      }

      this._drawChildren = false;

      if (drawChildren) {
        this.content = draw(this.iRender, this._nodes, this.content);
      }
    }

    _drawSelf() {
      const {
        _drawChildren: drawChildren,
        _drawContainer: drawContainer
      } = this;
      this._needDraw = false;
      this._drawChildren = false;
      this._drawContainer = false;

      if (drawContainer) {
        var _this$parent2;

        this.iRender.drawContainer(this._container, this._node, this.props, (_this$parent2 = this.parent) === null || _this$parent2 === void 0 ? void 0 : _this$parent2.iRender, true);
      }

      if (drawChildren) {
        this.content = draw(this.iRender, this._nodes, this.content);
      }
    }

    drawSelf() {
      if (!this.mounted) {
        return;
      }

      if (this.destroyed) {
        return;
      }

      this.callHook('beforeUpdate');
      exec(c => c && this.markDraw(this), () => this._drawSelf());
      complete(() => this.callHook('updated'));
    }

    markDraw(nObject, remove = false) {
      var _this$parent3;

      if (((_this$parent3 = this.parent) === null || _this$parent3 === void 0 ? void 0 : _this$parent3.iRender) === this.iRender) {
        this.parent.container.markDraw(nObject, remove);
        return;
      }

      if (nObject === this && this.parent) {
        this.parent.container.markDraw(this, remove);
        this._needDraw = !remove;
      } else if (remove) {
        this._awaitDraw.delete(nObject);
      } else {
        this._awaitDraw.add(nObject);
      }

      this.rootContainer.markDrawContainer(this, !this._needDraw && !this._awaitDraw.size || this.destroyed);
    }

    drawContainer() {
      const {
        _node: node,
        _container: container,
        _awaitDraw: awaitDraw
      } = this;

      if (!node || !container) {
        return;
      }

      this.callHook('beforeDraw');
      const needDraw = this._needDraw;
      this._needDraw = false;
      const list = [...awaitDraw];
      awaitDraw.clear();

      if (needDraw) {
        this.drawSelf();
      }

      list.map(c => c.draw());
      this.iRender.draw(container, node);
      complete(() => this.callHook('drawn'));
    }

    markDrawContainer(container, remove = false) {
      if (remove) {
        this._containers.delete(container);
      } else {
        this._containers.add(container);
      }

      markDraw(this);
    }

    drawAll() {
      const containers = this._containers;

      if (!containers.size) {
        return;
      }

      this.callHook('beforeDrawAll');
      const refs = [];
      const completeList = [];
      setCompleteList(completeList);
      setRefList(refs);
      const list = [...containers];
      containers.clear();
      list.forEach(c => c.drawContainer());
      setRefList();
      refs.forEach(r => r());
      completeList.forEach(r => r());
      this.callHook('drawnAll');
    }

  }

  function render(e, p = {}) {
    let params = { ...p
    };
    const container = new Container$1(getRender(p.type), params, e === undefined ? [] : isElement(e) ? [e] : [createElement(e)]);

    {
      devtools.renderHook(container);
    }

    const {
      exposed
    } = container;
    Reflect.defineProperty(exposed, '$update', {
      value(c) {
        container.setChildren(c === undefined ? [] : isElement(c) ? [c] : [createElement(c)]);
        return exposed;
      },

      configurable: true
    });
    Reflect.defineProperty(exposed, '$mount', {
      value(target) {
        if (exposed.$mounted) {
          return exposed;
        }

        if (target) {
          params.target = target;
          container.setProps(params);
        }

        container.mount();
        return exposed;
      },

      configurable: true
    });
    Reflect.defineProperty(exposed, '$unmount', {
      value() {
        if (!exposed.$mounted) {
          return;
        }

        if (exposed.$unmounted) {
          return;
        }

        if (exposed.$destroyed) {
          return container.destroy();
        }

        container.unmount();
        return;
      },

      configurable: true
    });

    if (params.target) {
      container.mount();
    }

    return exposed;
  }

  /*!
   * NeepWebRender v0.1.0-alpha.9
   * (c) 2019-2020 Fierflame
   * @license MIT
   */

  function installNeep() {
    return install;
  }

  function getId(v) {
    if (typeof v === 'string') {
      return v;
    }

    if (typeof v === 'number') {
      return String(v);
    }

    return undefined;
  }

  function updateId(props, el, old) {
    const id = getId(isValue(props.id) ? props.id() : props.id);

    if (id !== old) {
      if (typeof id === 'string') {
        el.id = props.id;
      } else {
        el.removeAttribute('id');
      }
    }

    return id;
  }

  function* recursive2iterable$1(list) {
    if (isValue(list)) {
      yield* recursive2iterable$1(list());
      return;
    }

    if (!Array.isArray(list)) {
      yield list;
      return;
    }

    for (const it of list) {
      yield* recursive2iterable$1(it);
    }
  }

  function getClass(list) {
    const set = new Set();

    for (const v of recursive2iterable$1(list)) {
      if (!v) {
        continue;
      }

      if (typeof v === 'string') {
        for (let k of v.split(' ').filter(Boolean)) {
          set.add(k);
        }
      } else if (typeof v === 'object') {
        for (const k in v) {
          const add = v[k];

          for (let it of k.split(' ').filter(Boolean)) {
            set[add ? 'add' : 'delete'](it);
          }
        }
      }
    }

    if (!set.size) {
      return undefined;
    }

    return set;
  }

  function update$1(el, classes, oClasses) {
    if (classes && oClasses) {
      const list = el.getAttribute('class') || '';
      const classList = new Set(list.split(' ').filter(Boolean));
      oClasses.forEach(c => classList.delete(c));
      classes.forEach(c => classList.add(c));
      el.setAttribute('class', [...classList].join(' '));
    } else if (classes) {
      el.setAttribute('class', [...classes].join(' '));
    } else if (oClasses) {
      el.removeAttribute('class');
    }
  }

  function updateClass(props, el, old) {
    const classes = getClass(isValue(props.class) ? props.class() : props.class);
    update$1(el, classes, old);
    return classes;
  }

  function getStyle(style) {
    if (typeof style === 'string') {
      return style;
    }

    if (!style) {
      return undefined;
    }

    if (typeof style !== 'object') {
      return undefined;
    }

    const css = Object.create(null);

    for (let k in style) {
      let value = style[k];
      const key = k.substr(0, 2) === '--' ? k : k.replace(/[A-Z]/g, '-$1').replace(/-+/g, '-').toLowerCase();

      if (typeof value === 'number') {
        css[key] = [value === 0 ? '0' : `${value}px`, null];
      } else if (value && typeof value === 'string') {
        const v = value.replace(/\!important\s*$/, '');
        css[key] = [v, v === value ? null : 'important'];
      }
    }

    return css;
  }

  function update$1$1(css, style, oStyle) {
    if (!style) {
      if (!oStyle) {
        return;
      }

      if (typeof oStyle === 'string') {
        css.cssText = '';
        return;
      }

      for (const k of Object.keys(oStyle)) {
        css.removeProperty(k);
      }

      return;
    }

    if (typeof style === 'string') {
      if (style !== typeof oStyle) {
        css.cssText = style;
      }

      return;
    }

    if (!oStyle || typeof oStyle === 'string') {
      if (typeof oStyle === 'string') {
        css.cssText = '';
      }

      for (const k of Object.keys(style)) {
        css.setProperty(k, ...style[k]);
      }

      return;
    }

    for (const k of Object.keys(style)) {
      const v = style[k];

      if (!oStyle[k] || oStyle[k][0] !== v[0] || oStyle[k][1] !== v[1]) {
        css.setProperty(k, ...v);
      }
    }

    for (const k of Object.keys(oStyle)) {
      if (!style[k]) {
        css.removeProperty(k);
      }
    }
  }

  function updateStyle(props, css, old, hasStyle) {
    if (!hasStyle) {
      return undefined;
    }

    const style = getStyle(isValue(props.style) ? props.style() : props.style);
    update$1$1(css, style, old);
    return style;
  }

  function setAttrs(el, attrs) {
    if (el instanceof HTMLInputElement && 'checked' in attrs) {
      switch (el.type.toLowerCase()) {
        case 'checkbox':
        case 'radio':
          if (attrs.checked !== null !== el.checked) {
            el.checked = attrs.checked !== null;
          }

      }
    }

    if ((el instanceof HTMLSelectElement || el instanceof HTMLInputElement) && 'value' in attrs) {
      const value = attrs.value || '';

      if (el.value !== value) {
        el.value = value;
      }
    }
  }

  function stringify(data, isOn = false) {
    if (data === undefined || data === null) {
      return data;
    }

    if (isOn && typeof data === 'function') {
      return undefined;
    }

    if (typeof data === 'boolean') {
      return data ? '' : null;
    }

    if (typeof data !== 'object') {
      return String(data);
    }

    if (data instanceof Date) {
      return data.toISOString();
    }

    if (data instanceof RegExp) {
      return data.toString();
    }

    return JSON.stringify(data);
  }

  function getAttrs(props, hasStyle) {
    const attrs = Object.create(null);

    for (const k in props) {
      if (/^(n|on|bind|slot)[:-]/.test(k)) {
        continue;
      }

      if (!/^[a-zA-Z:_][a-zA-Z0-9:_-]*$/.test(k)) {
        continue;
      }

      const name = k.toLowerCase();

      switch (name) {
        case 'style':
          if (!hasStyle) {
            break;
          }

        case 'ref':
        case 'is':
        case 'id':
        case 'class':
          continue;
      }

      let data = props[k];

      if (isValue(data)) {
        data = data();
      }

      const value = stringify(data, name.substr(0, 2) === 'on');

      if (value !== undefined) {
        attrs[name] = value;
      }
    }

    return attrs;
  }

  function update$2(el, attrs, old) {
    for (const k of Object.keys(attrs)) {
      const v = attrs[k];

      if (!(k in old) || old[k] !== v) {
        if (v === null) {
          el.removeAttribute(k);
        } else {
          el.setAttribute(k, v);
        }
      }
    }

    for (const k of Object.keys(old)) {
      if (!(k in attrs)) {
        el.removeAttribute(k);
      }
    }
  }

  function updateAttrs(props, el, old, hasStyle) {
    const attrs = getAttrs(props, hasStyle);
    update$2(el, attrs, old);
    setAttrs(el, attrs);
    return attrs;
  }

  function createEventEmitter() {
    const events = new EventEmitter();
    events.__eventBind = Object.create(null);
    return events;
  }

  function* getElementModel(el) {
    if (el instanceof HTMLInputElement) {
      switch (el.type.toLowerCase()) {
        case 'checkbox':
        case 'radio':
          return yield ['checked', 'change', e => e.currentTarget.checked];
      }

      return yield ['value', 'input', e => e.currentTarget.value];
    }

    if (el instanceof HTMLSelectElement) {
      return yield ['value', 'select', e => e.currentTarget.value];
    }
  }

  function getEventName$1(k) {
    if (k.substr(0, 2) !== 'on') {
      return '';
    }

    let n = k.substr(2);

    if (n[0] === ':' || n[0] === '-') {
      return '';
    }

    return n;
  }

  function updateEvent(props, el, event = createEventEmitter()) {
    event.updateInProps(props, addEvent => {
      for (const k in props) {
        const f = props[k];

        if (typeof f !== 'function') {
          continue;
        }

        const name = getEventName$1(k);

        if (!name) {
          continue;
        }

        addEvent(name, f);
      }

      for (const [prop, name, t] of getElementModel(el)) {
        const value = props[prop];

        if (isValue(value)) {
          addEvent(name, e => value(t(e)));
        }
      }
    });
    const names = new Set(event.names.map(String));
    const eventBind = event.__eventBind;

    for (const k of Object.keys(eventBind)) {
      if (names.has(k)) {
        continue;
      }

      eventBind[k]();
      delete eventBind[k];
    }

    const {
      emit
    } = event;

    for (const k of names) {
      if (k in eventBind) {
        continue;
      }

      const f = (...p) => emit(k, ...p);

      el.addEventListener(k, f);

      eventBind[k] = () => {
        el.removeEventListener(k, f);
      };
    }

    return event;
  }

  const PropsMap = new WeakMap();

  function update$3(el, props) {
    const css = el.style;
    const hasStyle = css instanceof CSSStyleDeclaration;
    const old = PropsMap.get(el) || {
      attrs: {}
    };
    const id = updateId(props, el, old.id);
    const classes = updateClass(props, el, old.classes);
    const style = updateStyle(props, css, old.style, hasStyle);
    const attrs = updateAttrs(props, el, old.attrs, hasStyle);
    const event = updateEvent(props, el, old.event);
    PropsMap.set(el, {
      id,
      classes,
      style,
      attrs,
      event
    });
    return el;
  }

  let list;

  function nextFrame$1(f) {
    if (list) {
      list.push(f);
      return;
    }

    list = [f];
    window.requestAnimationFrame(() => {
      const fs = list;
      list = undefined;

      if (!fs) {
        return;
      }

      fs.forEach(f => f());
    });
  }

  const xmlnsMap = {
    svg: 'http://www.w3.org/2000/svg',
    html: 'http://www.w3.org/1999/xhtml',
    mathml: 'http://www.w3.org/1998/Math/MathML'
  };
  const SVGTags = new Set(['altGlyph', 'altGlyphDef', 'altGlyphItem', 'animate', 'animateColor', 'animateMotion', 'animateTransform', 'circle', 'clipPath', 'color-profile', 'cursor', 'defs', 'desc', 'ellipse', 'feBlend', 'feColorMatrix', 'feComponentTransfer', 'feComposite', 'feConvolveMatrix', 'feDiffuseLighting', 'feDisplacementMap', 'feDistantLight', 'feFlood', 'feFuncA', 'feFuncB', 'feFuncG', 'feFuncR', 'feGaussianBlur', 'feImage', 'feMerge', 'feMergeNode', 'feMorphology', 'feOffset', 'fePointLight', 'feSpecularLighting', 'feSpotLight', 'feTile', 'feTurbulence', 'filter', 'font-face', 'font-face-format', 'font-face-name', 'font-face-src', 'font-face-uri', 'foreignObject', 'g', 'glyph', 'glyphRef', 'hkern', 'image', 'line', 'linearGradient', 'marker', 'mask', 'metadata', 'missing-glyph', 'mpath', 'path', 'pattern', 'polygon', 'polyline', 'radialGradient', 'rect', 'script', 'set', 'stop', 'style', 'svg', 'switch', 'symbol', 'text', 'textPath', 'title', 'tref', 'tspan', 'use', 'view', 'vkern']);
  const MathMLTags = new Set(['maction', 'math', 'menclose', 'merror', 'mfenced', 'mfrac', 'mglyph', 'mi', 'mlabeledtr', 'mmultiscripts', 'mn', 'mo', 'mover', 'mpadded', 'mphantom', 'mroot', 'mrow', 'ms', 'mspace', 'msqrt', 'mstyle', 'msub', 'msubsup', 'msup', 'mtable', 'mtd', 'mtext', 'mtr', 'munder', 'munderover', 'semantics']);

  function createElement$1(tagname, namespace) {
    const res = /^([a-z][a-z0-9-]*):([a-z0-9-]+)$/i.exec(tagname);
    const tag = res ? res[2] : tagname;
    const ns = (namespace || (res === null || res === void 0 ? void 0 : res[1]) || SVGTags.has(tag.toLowerCase()) && 'svg' || MathMLTags.has(tag.toLowerCase()) && 'mathml' || '').toLowerCase();

    if (!ns) {
      return document.createElement(tag);
    }

    return document.createElementNS(ns in xmlnsMap && xmlnsMap[ns] || ns, tag);
  }

  const render$1 = {
    type: 'web',
    nextFrame: nextFrame$1,

    isNode(v) {
      return v instanceof Node;
    },

    mount({
      target,
      class: className,
      style,
      tag
    }, parent) {
      if (!(typeof tag === 'string' && /^[a-z][a-z0-9]*(?:\-[a-z0-9]+)?(?:\:[a-z0-9]+(?:\-[a-z0-9]+)?)?$/i.test(tag))) {
        tag = 'div';
      }

      const container = render$1.create(tag, {
        class: className,
        style
      });

      if (typeof target === 'string') {
        target = document.querySelector(target);
      }

      if (target instanceof Element) {
        target.appendChild(container);

        if (parent) {
          return [container, parent.placeholder()];
        }

        return [container, container];
      }

      if (parent !== render$1) {
        document.body.appendChild(container);
        return [container, container];
      }

      return [container, container];
    },

    unmount(container, node, removed) {
      if (container === node && removed) {
        return;
      }

      container.remove();
    },

    drawContainer(container, node, {
      target,
      class: className,
      style,
      tag
    }, parent) {
      render$1.update(container, {
        class: className,
        style
      });

      if (typeof target === 'string') {
        target = document.querySelector(target);
      }

      if (parent !== render$1 && !(target instanceof Element)) {
        target = document.body;
      }

      const oldTarget = parent === render$1 && container === node ? undefined : render$1.parent(node);

      if (oldTarget === target) {
        return [container, node];
      }

      if (parent !== render$1) {
        target.appendChild(container);
        return [container, node];
      }

      if (!oldTarget) {
        const newNode = parent.placeholder();
        const pNode = parent.parent(node);

        if (pNode) {
          render$1.insert(pNode, newNode, node);
          render$1.remove(node);
        }

        return [container, newNode];
      }

      if (!target) {
        const pNode = parent.parent(node);

        if (pNode) {
          render$1.insert(pNode, container, node);
          render$1.remove(node);
        }

        return [container, container];
      }

      target.appendChild(node);
      return [container, node];
    },

    draw() {},

    create(tag, props) {
      return update$3(createElement$1(tag), props);
    },

    text(text) {
      return document.createTextNode(text);
    },

    placeholder() {
      return document.createComment('');
    },

    component() {
      const node = createElement$1('neep-component');
      return [node, node.attachShadow({
        mode: 'open'
      })];
    },

    parent(node) {
      return node.parentNode;
    },

    next(node) {
      return node.nextSibling;
    },

    update(node, props) {
      update$3(node, props);
    },

    insert(parent, node, next = null) {
      parent.insertBefore(node, next);
    },

    remove(node) {
      const p = render$1.parent(node);

      if (!p) {
        return;
      }

      p.removeChild(node);
    }

  };
  installNeep()({
    render: render$1
  });

  /*!
   * NeepDevtools v0.1.0-alpha.4
   * (c) 2019-2020 Fierflame
   * @license MIT
   */

  function install$1() {
    return install;
  }

  let Type;

  (function (Type) {
    Type["tag"] = "tag";
    Type["placeholder"] = "placeholder";
    Type["standard"] = "standard";
    Type["simple"] = "simple";
    Type["native"] = "native";
    Type["container"] = "container";
    Type["special"] = "special";
  })(Type || (Type = {}));

  function* getTree(tree, parent = 0) {
    var _component$exposed;

    if (Array.isArray(tree)) {
      for (const it of tree) {
        yield* getTree(it);
      }

      return;
    }

    const {
      id,
      tag,
      props,
      children,
      key,
      component,
      label = component === null || component === void 0 ? void 0 : (_component$exposed = component.exposed) === null || _component$exposed === void 0 ? void 0 : _component$exposed.$label
    } = tree;

    if (!tag) {
      return yield {
        id,
        parent,
        type: Type.placeholder,
        tag: 'placeholder',
        children: []
      };
    }

    if (typeof tag !== 'string') {
      const name = tag[nameSymbol] || tag.name;

      if (!component) {
        return yield {
          id,
          parent,
          type: Type.simple,
          tag: name,
          children: [...getTree(children)],
          props,
          key,
          label
        };
      }

      const isNative = tag[typeSymbol] === 'native';
      return yield {
        id,
        parent,
        type: isNative ? Type.native : Type.standard,
        tag: name,
        children: [...getTree('content' in component ? component.content : isNative ? component.nativeTree : component.tree)],
        props,
        key,
        label
      };
    }

    const ltag = tag.toLowerCase();

    if (ltag === 'neep:value') {
      const treeValue = tree.value;
      return yield {
        id,
        parent,
        type: Type.special,
        tag,
        children: [],
        isNative: treeValue === tree.node,
        value: treeValue,
        props,
        key,
        label
      };
    }

    if (ltag.substr(0, 5) === 'neep:' || ltag === 'template') {
      return yield {
        id,
        parent,
        type: Type.special,
        tag,
        children: [...getTree(children)],
        props,
        key,
        label
      };
    }

    yield {
      id,
      parent,
      type: Type.tag,
      tag,
      children: [...getTree(children)],
      props,
      key,
      label
    };
  }

  function getValue$1(value) {
    const type = typeof value;

    if (type === 'function') {
      return createElement("span", {
        style: "font-weight: bold;"
      }, "[Function]");
    }

    if (type === 'string') {
      return createElement("span", null, value);
    }

    if (type === 'bigint' || type === 'boolean' || type === 'number' || type === 'symbol' || type === 'undefined' || value === null) {
      return createElement("span", {
        style: "font-style: italic;"
      }, String(value));
    } else if (value instanceof RegExp) {
      return createElement("span", {
        style: "font-weight: bold;"
      }, String(value));
    } else if (value instanceof Date) {
      return createElement("span", {
        style: "font-weight: bold;"
      }, value.toISOString());
    } else if (type === 'object') {
      return createElement("span", {
        style: "font-style: italic;"
      }, String(value));
    }

    return null;
  }

  function TextNode({
    isNative,
    value
  }) {
    if (isNative) {
      return createElement("span", {
        style: "font-weight: bold;"
      }, "[Native]");
    }

    if (!isValue(value)) {
      return getValue$1(value);
    }

    return createElement("template", null, createElement("span", {
      style: "font-weight: bold;"
    }, "[Value:\xA0"), getValue$1(value()), createElement("span", {
      style: "font-weight: bold;"
    }, "\xA0]"));
  }

  function getOptions({
    value = false,
    tag = false,
    placeholder = false,
    simple = false,
    container = false,
    template = false,
    scopeSlot = false,
    slotRender = false,
    deliver = false
  }) {
    return {
      value,
      tag,
      placeholder,
      simple,
      container,
      template,
      scopeSlot,
      slotRender,
      deliver
    };
  }

  function createTag(name, keys, id, key, labels, ...children) {
    const opened = keys[id];
    const hasChildren = Boolean(children.length);
    return createElement("div", {
      key: id,
      style: " position: relative; min-height: 20px; font-size: 14px; line-height: 20px; "
    }, children.length && createElement("div", {
      style: " position: absolute; left: -20px; top: 0; width: 20px; height: 20px; text-align: center; cursor: pointer; background: #DDD;; ",
      onclick: () => keys[id] = !opened
    }, opened ? '-' : '+') || undefined, createElement("div", null, '<', name, typeof key === 'string' ? ` key="${key}"` : typeof key === 'number' ? ` key=${key}` : typeof key === 'boolean' ? ` key=${key}` : typeof key === 'bigint' ? ` key=${key}` : typeof key === 'symbol' ? ` key=${String(key)}` : key === null ? ` key=${key}` : key !== undefined && ` key={${String(key)}}`, hasChildren ? '>' : ' />', hasChildren && !opened && createElement("span", null, createElement("span", {
      onclick: () => keys[id] = true,
      style: "cursor: pointer;"
    }, "..."), '</', name, '>'), hasChildren && labels.filter(Boolean).map(([v, color]) => createElement("span", {
      style: `color: ${color || '#000'}`
    }, v))), hasChildren && opened && createElement("div", {
      style: "padding-left: 20px"
    }, children), opened && hasChildren && createElement("div", null, '</', name, '>'));
  }

  function* getList(list, keys, options, labels = []) {
    if (Array.isArray(list)) {
      for (const it of list) {
        yield* getList(it, keys, options, labels);
      }

      return;
    }

    const {
      id,
      type,
      tag,
      children,
      props,
      key,
      label,
      value,
      isNative
    } = list;

    if (type === Type.standard || type === Type.native) {
      return yield createTag(createElement("span", {
        style: "font-weight: bold;"
      }, tag), keys, id, key, [label, ...labels], ...getList(children, keys, options));
    }

    if (type === Type.tag) {
      if (!options.tag) {
        return yield* getList(children, keys, options, [label, ...labels]);
      }

      return yield createTag(tag, keys, id, key, [label, ...labels], ...getList(children, keys, options));
    }

    if (type === Type.simple) {
      if (!options.simple) {
        return yield* getList(children, keys, options, [label, ...labels]);
      }

      return yield createTag(createElement("span", {
        style: " font-style: italic; font-weight: bold; "
      }, tag), keys, id, key, [label, ...labels], ...getList(children, keys, options));
    }

    if (type === Type.placeholder) {
      if (!options.placeholder) {
        return;
      }

      return yield createTag(createElement("span", {
        style: "font-style: italic;"
      }, "placeholder"), keys, id, key, [label, ...labels], ...getList(children, keys, options));
    }

    if (type === Type.container) {
      if (!options.container) {
        return yield* getList(children, keys, options, [label, ...labels]);
      }

      return yield createTag(createElement("span", {
        style: "font-style: italic;"
      }, "container"), keys, id, key, [label, ...labels], ...getList(children, keys, options));
    }

    const ltag = tag.toLowerCase();

    if (ltag === 'neep:deliver') {
      if (!options.deliver) {
        return yield* getList(children, keys, options, [label, ...labels]);
      }

      return yield createTag(createElement("span", {
        style: "font-style: italic;"
      }, "Deliver"), keys, id, key, [label, ...labels], ...getList(children, keys, options));
    }

    if (ltag === 'template') {
      if (!options.template) {
        return yield* getList(children, keys, options, [label, ...labels]);
      }

      return yield createTag(createElement("span", {
        style: "font-style: italic;"
      }, "Template"), keys, id, key, [label, ...labels], ...getList(children, keys, options));
    }

    if (ltag === 'neep:scopeslot' || ltag === 'neep:scope-slot') {
      if (!options.scopeSlot) {
        return yield* getList(children, keys, options, [label, ...labels]);
      }

      return yield createTag(createElement("span", {
        style: "font-style: italic;"
      }, "ScopeSlot"), keys, id, key, [label, ...labels], ...getList(children, keys, options));
    }

    if (ltag === 'neep:slotrender' || ltag === 'neep:slot-render') {
      if (options.slotRender) ;
      return;
    }

    if (ltag === 'neep:value') {
      if (!options.tag) {
        return;
      }

      if (!options.value) {
        return;
      }

      return yield createElement(TextNode, {
        isNative: isNative,
        value: value
      });
    }
  }

  var App = props => {
    const keys = encase({});
    return () => createElement("div", {
      style: "padding-left: 20px;"
    }, [...getList(props.tree, keys, getOptions(props))]);
  };

  let creating = false;

  function create$2() {
    creating = true;

    try {
      return render();
    } finally {
      creating = false;
    }
  }

  const devtools$1 = {
    renderHook(container) {
      if (creating) {
        return;
      }

      let app;

      const getData = () => {
        if (!app) {
          app = create$2();
        }

        const tree = [...getTree(container.content)];
        app.$update(createElement(App, {
          tree,
          value: true,
          tag: true
        }));
      };

      setHook('drawnAll', getData, container.entity);
      setHook('mounted', () => {
        if (!app) {
          app = create$2();
        }

        getData();
        app.$mount();
      }, container.entity);
    }

  };
  install$1()({
    devtools: devtools$1
  });

  function _defineProperty$1(obj, key, value) {
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
  }, {
    createElement,
    Deliver,
    label
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

  function RouterLink(props, context, auxiliary) {
    var _route$history;

    const {
      route,
      childNodes
    } = context;
    const {
      createElement
    } = auxiliary;

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
    }, context, auxiliary, onclick)) || createElement('span', {
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

  function install$2(Neep) {}
  installComponents();
  installContextConstructor();

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

  function getValue$2(v) {
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

  function stringify$1(s) {
    const list = [];

    for (const key of Object.keys(s)) {
      const value = s[key];
      const k = encodeURIComponent(key);

      if (!Array.isArray(value)) {
        const v = getValue$2(value);

        if (v === undefined) {
          continue;
        }

        list.push(v === null ? k : `${k}=${v}`);
        continue;
      }

      for (const val of value) {
        const v = getValue$2(val);

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
      _defineProperty$1(this, "router", void 0);

      _defineProperty$1(this, "index", 0);

      _defineProperty$1(this, "history", []);

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
    }, {
      createElement
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
      _defineProperty$1(this, "router", void 0);

      _defineProperty$1(this, "base", void 0);

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
    }, {
      createElement
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
      _defineProperty$1(this, "router", void 0);

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
    }, {
      createElement
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

  function get(location, routes, basePath, stringifyQuery = stringify$1) {
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

  function update$4(obj, props = {}) {
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
      return install$2;
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
      _defineProperty$1(this, "_namedRoutes", Object.create(null));

      _defineProperty$1(this, "_routes", []);

      _defineProperty$1(this, "history", void 0);

      _defineProperty$1(this, "_size", value(0));

      _defineProperty$1(this, "_nodes", []);

      _defineProperty$1(this, "_matches", value([]));

      _defineProperty$1(this, "_hash", value(''));

      _defineProperty$1(this, "_search", value(''));

      _defineProperty$1(this, "_alias", value(''));

      _defineProperty$1(this, "_path", value('/'));

      _defineProperty$1(this, "_state", value(undefined));

      _defineProperty$1(this, "params", encase(Object.create(null)));

      _defineProperty$1(this, "query", encase(Object.create(null)));

      _defineProperty$1(this, "meta", encase(Object.create(null)));

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
            throw new NeepError(`Too many consecutive redirect jumps: \n${redirects.join('\n')}`, 'router');
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

        update$4(this.params, (last === null || last === void 0 ? void 0 : last.params) || {});
        update$4(this.meta, (last === null || last === void 0 ? void 0 : (_last$route2 = last.route) === null || _last$route2 === void 0 ? void 0 : _last$route2.meta) || {});
      }

      if (this._search() !== search) {
        this._search(search);

        update$4(this.query, (this.parse || parse$1)(search.substr(1)));
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
      Reflect.defineProperty(this, 'view', {
        value: view,
        enumerable: true,
        configurable: true
      });
      return view;
    }

  }

  const User = create$1((props, {
    slots,
    delivered,
    route
  }, {
    Template,
    Slot,
    createElement,
    useValue
  }) => {
    var _route$params;

    return createElement(Template, null, createElement("div", null, "\u7528\u6237\u9996\u9875"), createElement("div", null, "Id: ", route === null || route === void 0 ? void 0 : (_route$params = route.params) === null || _route$params === void 0 ? void 0 : _route$params['id']), createElement("hr", null), createElement("div", null, createElement(Router.Link, {
      path: "/"
    }, "\u9996\u9875")), createElement("div", null, createElement(Router.Link, {
      path: "/users/1"
    }, "\u7528\u62371")), createElement("div", null, createElement(Router.Link, {
      path: "/users/2"
    }, "\u7528\u62372")), createElement("div", null, createElement(Router.Link, {
      path: "/users/1/info"
    }, "\u7528\u62371\u4FE1\u606F")), createElement("div", null, createElement(Router.Link, {
      path: "/users/1/settings"
    }, "\u7528\u62371\u8BBE\u7F6E")), createElement("hr", null), createElement(Router.View, null));
  });
  var User$1 = mark(User, mName('User'));

  const Info = create$1((props, {
    slots,
    delivered,
    route
  }, {
    Template,
    Slot,
    createElement,
    useValue
  }) => {
    var _route$params;

    const v = useValue(() => Math.random());
    return createElement(Template, null, createElement("div", null, "\u7528\u6237\u4FE1\u606F"), createElement("div", null, "Id: ", route === null || route === void 0 ? void 0 : (_route$params = route.params) === null || _route$params === void 0 ? void 0 : _route$params['id']));
  });
  var Info$1 = mark(Info, mName('UserInfo'));

  const Settings = create$1((props, {
    slots,
    delivered,
    route
  }, {
    Template,
    Slot,
    createElement,
    useValue
  }) => {
    var _route$params;

    return createElement(Template, null, createElement("div", null, "\u7528\u6237\u8BBE\u7F6E"), createElement("div", null, "Id: ", route === null || route === void 0 ? void 0 : (_route$params = route.params) === null || _route$params === void 0 ? void 0 : _route$params['id']));
  });
  var Settings$1 = mark(Settings, mName('UserSettings'));

  const Home = create$1((props, {
    slots,
    delivered,
    route
  }, {
    Template,
    Slot,
    createElement,
    useValue
  }) => {
    return createElement(Template, null, createElement("div", null, "\u9996\u9875"), createElement("hr", null), createElement("div", null, createElement(Router.Link, {
      path: "/"
    }, "\u9996\u9875")), createElement("div", null, createElement(Router.Link, {
      path: "/users/1"
    }, "\u7528\u62371")), createElement("div", null, createElement(Router.Link, {
      path: "/users/1/settings"
    }, "\u7528\u62371\u8BBE\u7F6E")), createElement("hr", null), createElement(Router.View, null));
  });
  var Home$1 = mark(Home, mName('Home'));

  const router = new Router({
    History: Router.history.WebHash
  });
  router.setRoutes([{
    path: '/',
    redirect: '/home'
  }, {
    path: '/users/:id',
    component: User$1,
    children: [{
      path: 'info',
      component: Info$1
    }, {
      path: 'settings',
      component: Settings$1
    }]
  }, {
    path: '/home',
    component: Home$1
  }, {
    path: '*',
    redirect: '/home'
  }]);
  window.router = router;
  const App$1 = create$1((props, context, {
    createElement
  }) => createElement(Router.View, {
    router: router
  }));
  var App$2 = mark(App$1, mName('App'));

  render(App$2).$mount();

})));
//# sourceMappingURL=index.js.map


/**
 * Module dependencies
 */

var fs = require('fs')
  , Ware = require('ware')

/**
 * `Model' constructor
 *
 * @api public
 * @param {Function} query
 */

module.exports = Model;
function Model (query) {
  if (!(this instanceof Model)) {
    return new Model(query);
  }

  this.bindings = {};
  this.filters = {};
  this.query = query;
}

/**
 * Executes a query ignoring filters or
 * usage of a `Binding'
 *
 * @api public
 * @param {String} sql
 * @param {Array} params
 * @param {Function} done
 */

Model.prototype.exec = function (sql, params, done) {
  if (3 == arguments.length) {
    this.query(String(sql), params, done);
  } else if (2 == arguments.length) {
    this.query(String(sql), params);
  } else {
    throw new Error("incorrect arguments");
  }
  return this;
};

/**
 * Creates a binding for
 * a model and attaches as a
 * method to instance
 *
 * @api public
 * @param {String} name
 * @param {Object} map
 * @param {String} sql
 */

Model.prototype.bind = function (name, map, sql) {
  var binding = new Binding(map, String(sql), this.query.bind(this));
  var filters = this.filters;
  this.bindings[name] = binding;
  this[name] = function (o, fn) {
    // object with callback
    if (2 == arguments.length) {
      binding.query(this.filter(o), fn);
    } else if (1 == arguments.length) {
      binding.query(o);
    } else {
      throw new Error("incorrect arguments");
    }
    return this;
  };
  return this;
};

/**
 * Installs plugin for property found in binding
 * maps
 *
 * @api public
 * @param {String} name
 * @param {Function} fn
 */

Model.prototype.use = function (name, fn) {
  (this.filters[name] = this.filters[name] || []).push(fn);
  return this;
};

/**
 * Applies set filters to an object
 *
 * @api public
 * @param {Object} o
 */

Model.prototype.filter = function (o) {
  var filters = this.filters;
  Object.keys(o).forEach(function (k) {
    if (filters[k]) {
      filters[k].forEach(function (fn) {
        var r = fn(o[k]);
        if (r) { o[k] = r; }
      });
    }
  });
  return o;
};

/**
 * `Binding' constructor
 *
 * @api public
 * @param {Object} map
 * @param {String} sql
 * @param {Function} query
 */

module.exports.Binding = Binding;
function Binding (map, sql, query) {
  if (!(this instanceof Binding)) {
    return new Binding(map, sql);
  }

  this.map = map;
  this.sql = sql;
  this._query = query;
}

// `_query' interface
Binding.prototype._query = function () {
  throw new Error("not implemented");
};

/**
 * Query with underlying query function
 * and data bound to params
 *
 * @api public
 * @param {Object} data - optional
 * @param {Function} fn
 */

Binding.prototype.query = function (data, fn) {
  if (2 == arguments.length) {
    this._query(this.sql, this.params(data), fn);
  } else if (1 == arguments.length) {
    this._query(this.sql, fn);
  } else {
    throw new Error("incorrect arguments");
  }
  return this;
};

/**
 * Builds SQL parameters
 *
 * @api public
 * @param {Object} data
 */

Binding.prototype.params = function (data) {
  var map = this.map;
  return params = (
    Object.keys(map)
    .map(function (k) { return {key: k, value: String(map[k])}; })
    .filter(function (_) { return /\$?[0-9]+/.test(_.value); })
    .map(function (_) { return {key: _.key, value: _.value.replace(/\$/, '')}; })
    .sort(function (a, b) { return a.value < b.value ? -1 : a.value == b.value ? 0 : 1; })
    .map(function (_) { return data[_.key]; })
    .map(function (v) { return v || null; })
  );
};


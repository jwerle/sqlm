sqlm
====

Modelize SQL queries with key to parameter bindings

## install

```js
$ npm install sqlm
```

## usage

```js

/**
 * @param {Function} query - called when attempting to query database
 */

function sqlm (query) { ... }
```

## example

```js
var sqlm = require('sqlm')
  , fs = require('fs')
  , pg = require('pg')

pg.connect({database: 'db', function (err, db, close) {
  if (err) { throw err; }
  var User = sqlm(function (query, params, done) {
    if (query && params && done) {
      db.query(query, params, done);
    } else if (query && params) {
      db.query(query, params);
    }
  });

  // salt passwords each time they are passed to
  // a model method
  User.use('password', function (value) {
    var md5 = Hash('md5');
    md5.write(value);
    md5.end();
    return md5.read().toString('hex');
  });

  User.bind('create', {
    username: 1, email: 2, password: 3
  }, fs.readFileSync('/path/to/users/create.sql'));

  User.create({
    username: 'werle' email: 'joseph@werle.io',
    password: 'foo' // becomes 'acbd18db4cc2f85cedef654fccc4a4d8'
  }, function (err, res) {
    if (err) { throw err; }
    console.log(res.rows); // from pg query above
  });
});
```

## api

### Model

```js
function Model (query) { ... }
```

* `Function query` - A function called when attempting to query the database

#### #exec

```js
Model.prototype.exec = function (sql, params, done) { ... }
```

Executes a query ignoring filters or usage of a `Binding'

* `String sql` - SQL query
* `Array params` - Query Paramaters
* `Function done` - Callback called after querying database

#### #bind

```js
Model.prototype.bind = function (name, map, sql) { ... }
```

Creates a binding for a model and attaches as a method to instance

* `String name` - Binding name attached as a method to `Model` instance
* `object map` - key to numbered query paramaters map
* `string sql` - raw parameterized sql query

#### #use

```js
Model.prototype.use = function (name, fn) { ... }
```

Installs plugin for property found in binding maps

* `String name` - Property name to install plugin for
* `Function fn` - Plugin routine

#### #filter

```js
Model.prototype.filter = function (o) { ... }
```

Applies set filters to an object

* `Object} o` - Object to apply filters to

### Binding

```js
function Binding (map, sql, query) { ... }
```

* `object map` - key to numbered query paramaters map
* `string sql` - raw parameterized sql query
* `Function query` - A function called when attempting to query the database

#### #_query

`_query()` interface method that must be implemented.

#### #query

```js
Binding.prototype.query = function (data, fn) { ... }
```

Query with underlying query function and data bound to params

* `Object data` - *optional* Data that will be paramterized in the order in which they were defined in the `map`
* `Function fn` - Callback function passed to the `_query` function

#### #params

```js
Binding.prototype.params = function (data) { ... }
```

Builds SQL parameters

* `Object data` - Data to paramertize in an array defiend by the `map`

## license

MIT

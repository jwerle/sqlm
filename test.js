
var assert = require('assert')
  , sqlm = require('./')
  , pg = require('pg')
  , fs = require('fs')
  , Batch = require('batch')
  , Hash  = require('crypto').createHash

var fread = fs.readFileSync;

function extend (a, b) {
  return Object.keys(b).reduce(function (a, k) {
    a[k] = b[k];
    return a;
  }, a);
}

pg.connect({database: 'sqlmtest'}, function (err, client, release) {
  if (err) { throw err; }
  onready(client, release);
});

function onready (db, release) {
  var user = null; // user ref
  var batch = new Batch().concurrency(1);
  var User = sqlm(function (query, params, done) {
    db.query.apply(db, arguments);
  });

  User.use('password', function (value) {
    var md5 = Hash('md5');
    md5.write(value);
    md5.end();
    return md5.read().toString('hex');
  });

  User.bind('create', {
    username: 1,
    email: 2,
    password: 3
  }, fread('./test/sql/create.sql'));

  User.bind('read', {
    username: 1,
    email: 2
  }, fread('./test/sql/read.sql'));

  User.bind('update', {
    username: 1,
    email: 2,
    password: 3
  }, fread('./test/sql/update.sql'));

  User.bind('delete', {
    username: 1,
    email: 2
  }, fread('./test/sql/delete.sql'));

  batch.push(function (next) {
    User.exec(fread('./test/ddl/users.sql'), next);
  });

  batch.push(function (next) {
    User.create({
      username: 'werle',
      email: 'joseph@werle.io',
      password: 'yes'
    }, next);
  });

  batch.push(function (next) {
    User.read({username: 'werle'}, function (err, res) {
      if (err) { throw err; }
      assert(res);
      user = res.rows[0];
      next();
    });
  });

  batch.push(function (next) {
    User.update(extend(user, {
      email: 'werle@werle.io',
      username: 'werle',
      password: 'no'
    }), next);
  });

  batch.push(function (next) {
    User.delete({username: 'werle'}, next);
  });

  batch.end(function (err) {
    if (err) { throw err; }
    release();
    db.end();
  });
}


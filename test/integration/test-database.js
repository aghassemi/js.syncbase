// Copyright 2015 The Vanadium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

var async = require('async');
var format = require('format');
var stringify = require('json-stable-stringify');
var test = require('prova');
var toArray = require('stream-to-array');

var vanadium = require('vanadium');
var naming = vanadium.naming;
var vdl = vanadium.vdl;

var Database = require('../../src/nosql/database');
var Table = require('../../src/nosql/table');

var nosql = require('../..').nosql;
var Schema = nosql.Schema;
var SchemaMetadata = nosql.SchemaMetadata;

var testUtil = require('./util');
var setupApp = testUtil.setupApp;
var setupDatabase = testUtil.setupDatabase;
var setupTable = testUtil.setupTable;
var uniqueName = testUtil.uniqueName;

test('app.noSqlDatabase(name) returns a database with correct name',
     function(t) {
  setupApp(t, function(err, o) {
    if (err) {
      return t.end(err);
    }

    var dbName = uniqueName('db');
    var db = o.app.noSqlDatabase(dbName);

    t.ok(db, 'Database is constructed.');
    t.ok(db instanceof Database, 'database is a Database object.');
    t.equal(db.name, dbName, 'Database has the correct name.');

    db.name = 'foo';
    t.equal(db.name, dbName, 'Setting the name has no effect.');

    var expectedFullName = naming.join(o.app.fullName, dbName);
    t.equal(db.fullName, expectedFullName, 'Database has correct fullName.');

    db.fullName = 'bar';
    t.equal(db.fullName, expectedFullName, 'Setting fullName has no effect.');

    o.teardown(t.end);
  });
});

test('app.noSqlDatabase(name, schema) returns a database with correct schema',
     function(t) {
  setupApp(t, function(err, o) {
    if (err) {
      return t.end(err);
    }

    var version = 123;
    var md = new SchemaMetadata({version: version});
    var schema = new Schema(md);

    var dbName = uniqueName('db');
    var db = o.app.noSqlDatabase(dbName, schema);

    t.ok(db, 'Database is constructed.');
    t.ok(db instanceof Database, 'database is a Database object.');
    t.equal(db.schema, schema, 'database has correct schema.');
    t.equal(db.schemaVersion, version, 'database has correct schemaVersion');

    o.teardown(t.end);
  });
});

test('db.create() creates a database', function(t) {
  setupApp(t, function(err, o) {
    if (err) {
      return t.end(err);
    }

    var db = o.app.noSqlDatabase(uniqueName('db'));
    var db2 = o.app.noSqlDatabase(uniqueName('db'));

    async.waterfall([
      // Verify database does not exist yet.
      db.exists.bind(db, o.ctx),
      function(exists, cb) {
        t.notok(exists, 'exists: database doesn\'t exist yet');
        cb(null);
      },

      // Verify database list is empty.
      o.app.listDatabases.bind(o.app, o.ctx),
      function(dbList, cb) {
        t.deepEqual(dbList, [],
          'listDatabases: no databases exist');
        cb(null);
      },

      // Create database.
      db.create.bind(db, o.ctx, {}),

      // Verify database exists.
      db.exists.bind(db, o.ctx),
      function(exists, cb) {
        t.ok(exists, 'exists: database exists');
        cb(null);
      },

      // Verify database list contains the database.
      o.app.listDatabases.bind(o.app, o.ctx),
      function(dbList, cb) {
        t.deepEqual(dbList, [db.name],
          'listDatabases: database exists');
        cb(null);
      },

      // Create another database.
      db2.create.bind(db2, o.ctx, {}),

      // Verify database list contains both databases.
      o.app.listDatabases.bind(o.app, o.ctx),
      function(dbList, cb) {
        t.deepEqual(dbList.sort(), [db.name, db2.name].sort(),
          'listDatabases: both databases exist');
        cb(null);
      },
    ], function(err, arg) {
      t.error(err);
      o.teardown(t.end);
    });
  });
});

test('creating a database twice should error', function(t) {
  setupApp(t, function(err, o) {
    if (err) {
      return t.end(err);
    }

    var db = o.app.noSqlDatabase(uniqueName('db'));

    // Create once.
    db.create(o.ctx, {}, function(err) {
      if (err) {
        t.error(err);
        return o.teardown(t.end);
      }

      // Create again.
      db.create(o.ctx, {}, function(err) {
        t.ok(err, 'should error.');
        o.teardown(t.end);
      });
    });
  });
});

test('db.destroy() destroys a database', function(t) {
  setupApp(t, function(err, o) {
    if (err) {
      return t.end(err);
    }

    var db = o.app.noSqlDatabase(uniqueName('db'));

    async.waterfall([
      // Create database.
      db.create.bind(db, o.ctx, {}),

      // Verify database exists.
      db.exists.bind(db, o.ctx),
      function(exists, cb) {
        t.ok(exists, 'database exists');
        cb(null);
      },

      // Destroy database.
      db.destroy.bind(db, o.ctx),

      // Verify database no longer exists.
      db.exists.bind(db, o.ctx),
      function(exists, cb) {
        t.notok(exists, 'database no longer exists');
        cb(null);
      },
    ], function(err, arg) {
      t.error(err);
      o.teardown(t.end);
    });
  });
});

test('destroying a db that has not been created should not error', function(t) {
  setupApp(t, function(err, o) {
    if (err) {
      return t.end(err);
    }

    var db = o.app.noSqlDatabase(uniqueName('db'));

    db.destroy(o.ctx, function(err) {
      t.error(err);
      o.teardown(t.end);
    });
  });
});

test('db.table() returns a table', function(t) {
  setupApp(t, function(err, o) {
    if (err) {
      return t.end(err);
    }

    var db = o.app.noSqlDatabase(uniqueName('db'));
    var tableName = uniqueName('table');
    var table = db.table(tableName);

    t.ok(table, 'table is created.');
    t.ok(table instanceof Table, 'table is a Table object.');
    t.equal(table.name, tableName, 'table has the correct name.');
    t.equal(table.fullName, vanadium.naming.join(db.fullName, tableName),
      'table has the correct fullName.');

    o.teardown(t.end);
  });
});

test('Getting/Setting permissions of a database', function(t) {
  setupDatabase(t, function(err, o) {
    if (err) {
      return t.end(err);
    }

    testUtil.testGetSetPermissions(t, o.ctx, o.database, function(err) {
      t.error(err);
      return o.teardown(t.end);
    });
  });
});

test('database.exec', function(t) {
  setupTable(t, function(err, o) {
    if (err) {
      return t.end(err);
    }

    var ctx = o.ctx;
    var db = o.database;
    var table = o.table;

    var personType = new vdl.Type({
      kind: vdl.kind.STRUCT,
      name: 'personType',
      fields: [
        {
          name: 'first',
          type: vdl.types.STRING
        },
        {
          name: 'last',
          type: vdl.types.STRING
        },
        {
          name: 'employed',
          type: vdl.types.BOOL
        },
        {
          name: 'age',
          type: vdl.types.INT32
        }
      ]
    });

    var homer = {
      first: 'Homer',
      last: 'Simpson',
      employed: true,
      age: 38
    };

    var bart = {
      first: 'Bart',
      last: 'Simpson',
      employed: false,
      age: 10
    };

    var maggie = {
      first: 'Maggie',
      last: 'Simpson',
      employed: false,
      age: 1
    };

    var moe = {
      first: 'Moe',
      last: 'Syzlak',
      employed: true,
      age: 46
    };

    var people = [homer, bart, maggie, moe];

    var cityType = new vdl.Type({
      kind: vdl.kind.STRUCT,
      name: 'cityType',
      fields: [
        {
          name: 'name',
          type: vdl.types.STRING
        },
        {
          name: 'population',
          type: vdl.types.INT32
        },
        {
          name: 'age',
          type: vdl.types.INT32
        }
      ]
    });

    var springfield = {
      name: 'Springfield',
      population: 30720,
      age: 219
    };

    var shelbyville = {
      name: 'Shelbyville',
      population: 600000,
      age: 220
    };

    var cities = [springfield, shelbyville];

    var testCases = [
      {
        q: 'select k, v from %s',
        want: [
          ['k', 'v'],
          ['Homer', homer],
          ['Bart', bart],
          ['Moe', moe],
          ['Maggie', maggie],
          ['Springfield', springfield],
          ['Shelbyville', shelbyville]
        ]
      },
      {
        q: 'select k, v.Age from %s',
        want: [
          ['k', 'v.Age'],
          ['Homer', homer.age],
          ['Bart', bart.age],
          ['Moe', moe.age],
          ['Maggie', maggie.age],
          ['Springfield', springfield.age],
          ['Shelbyville', shelbyville.age]
        ]
      },
      {
        q: 'select k, v.First from %s where Type(v) = "personType"',
        want: [
          ['k', 'v.First'],
          ['Homer', homer.first],
          ['Bart', bart.first],
          ['Moe', moe.first],
          ['Maggie', maggie.first]
        ]
      },
      {
        q: 'select k, v.Population from %s where Type(v) = "cityType"',
        want: [
          ['k', 'v.Population'],
          ['Shelbyville', shelbyville.population],
          ['Springfield', springfield.population],
        ]
      },
      {
        q: 'select k, v from %s where v.Age = 10',
        want: [
          ['k', 'v'],
          ['Bart', bart]
        ]
      },
      {
        q: 'select k, v from %s where k = "Homer"',
        want: [
          ['k', 'v'],
          ['Homer', homer],
        ]
      },
      {
        // Note the double-percent below. The query is passed through 'format'
        // to insert the table name. The double %% will be replaced with a
        // single %.
        q: 'select k, v from %s where k like "M%%"',
        want: [
          ['k', 'v'],
          ['Moe', moe],
          ['Maggie', maggie],
        ]
      },
      {
        q: 'select k, v from %s where v.Employed = true',
        want: [
          ['k', 'v'],
          ['Homer', homer],
          ['Moe', moe],
        ]
      },
      {
        q: 'select k, v from %s where k = ? or v.Age = ?',
        paramValues: [
          'Moe',
          38,
        ],
        paramTypes: [
          vdl.types.STRING,
          vdl.types.INT32,
        ],
        want: [
          ['k', 'v'],
          ['Homer', homer],
          ['Moe', moe],
        ]
      },
    ];

    putPeople();

    // Put all people, keyed by their first name.
    function putPeople() {
      async.forEach(people, function(person, cb) {
        table.put(ctx, person.first, person, personType, cb);
      }, putCities);
    }

    // Put all cities, keyed by their name.
    function putCities(err) {
      if (err) {
        return end(err);
      }

      async.forEach(cities, function(city, cb) {
        table.put(ctx, city.name, city, cityType, cb);
      }, runTestCases);
    }

    // Check all the test cases.
    function runTestCases(err) {
      if (err) {
        return end(err);
      }

      async.forEachSeries(testCases, function(testCase, cb) {
        assertExec(format(testCase.q, table.name),
                   testCase.paramValues, testCase.paramTypes,
                   testCase.want, cb);
      }, end);
    }

    function end(err) {
      t.error(err);
      o.teardown(t.end);
    }

    // Assert that query 'q' returns the rows in 'want'.
    function assertExec(q, paramValues, paramTypes, want, cb) {
      var testCb = function(err) {
        t.error(err);
        cb();
      };
      var stream = paramValues === undefined ?
        db.exec(ctx, q, testCb) :
        db.exec(ctx, q, paramValues, paramTypes, testCb);
      stream.on('error', t.error);
      toArray(stream, function(err, got) {
        t.error(err);
        got.sort(arrayCompare);
        want.sort(arrayCompare);

        var msg = 'query: "' + q + '" returns the correct values';
        t.deepEqual(got, want, msg);
      });
    }
  });
});

// Compare two arrays by json-encoding all items, then joining and treating it
// as string.  Used to sort an array of arrays deterministically.
function arrayCompare(a1, a2) {
  var a1s = a1.map(stringify).join('/');
  var a2s = a2.map(stringify).join('/');

  if (a1s <= a2s) {
    return -1;
  }
  if (a1s >= a2s) {
    return 1;
  }
  return 0;
}

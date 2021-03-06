// Copyright 2015 The Vanadium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

var rowrange = require('./rowrange');
var runInBatch = require('./batch').runInBatch;
var Schema = require('./schema');
var vdl = require('../gen-vdl/v.io/v23/services/syncbase/nosql');
var watch = require('./watch');

/**
 * Defines the client API for the NoSQL part of Syncbase.
 * @namespace
 * @name nosql
 * @memberof module:syncbase
 */
module.exports = {
  BatchOptions: vdl.BatchOptions,
  BlobRef: vdl.BlobRef,
  ReadOnlyBatchError: vdl.ReadOnlyBatchError,
  ResumeMarker: watch.ResumeMarker,
  rowrange: rowrange,
  runInBatch: runInBatch,
  Schema: Schema,
  SchemaMetadata: vdl.SchemaMetadata,
  SyncgroupMemberInfo: vdl.SyncgroupMemberInfo,
  TableRow: vdl.TableRow,
  SyncgroupSpec: vdl.SyncgroupSpec,
  WatchChange: watch.WatchChange
};

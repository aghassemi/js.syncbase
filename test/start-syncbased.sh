#!/bin/bash
# Copyright 2015 The Vanadium Authors. All rights reserved.
# Use of this source code is governed by a BSD-style
# license that can be found in the LICENSE file.

# Start syncbased and mount in the mounttable.

# TODO(nlacasse): This file is needed because the javascript service-runner
# does not allow flags or arguments to the executables it starts.  We should
# fix service-runner to allow flags/arguments, and then have it start syncbased
# directly with the appropriate flags.  Then we can delete this file.

TESTDIR="$(mktemp -d "${TMPDIR:-/tmp}"/sbtest.XXXXXXXX)"
# Delete TESTDIR and stop syncbased on exit.
function cleanup {
	rm -rf "${TESTDIR}"
	kill -TERM "${CHILD}" 2>/dev/null
	exit 0
}
trap cleanup SIGINT SIGTERM EXIT

syncbased -v=3 --name test/syncbased --engine "${STORAGE_ENGINE:-leveldb}" --root-dir "${TESTDIR}" --v23.tcp.address 127.0.0.1:0 &

CHILD=$!
wait "${CHILD}"

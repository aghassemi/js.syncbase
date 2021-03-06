# Syncbase JavaScript Client

This repository defines the JavaScript API for Syncbase, a structured store
that supports peer-to-peer synchronization.

The client APIs defined here work both in [Node.js] and the browser.

## Install

    npm install --save vanadium/js.syncbase

## Usage

Documentation for this API is [TODO(aghassemi)](LINK TO JS DOCUMENTATION)

Tutorials can be found at [TODO(aghassemi)](LINK TO JS TUTORIAL FOR SYNCBASE)

The entry point to the API is through a module called `syncbase`,
everything else is considered private and should not be accessed by the users
of the API.

When using [Browserify] or [Node.js] users can gain access to the API with:

    var syncbase = require("syncbase");

When run in a browser, syncbase expects that the [vanadium
extension](https://vanadium.github.io/tools/vanadium-chrome-extension.html)
will be installed.

## Bugs and feature requests

Bugs and feature requests should be filed in the
[Vanadium issue tracker](https://github.com/vanadium/issues/issues).

## Building and testing

GNU Make is used to build and test Syncbase.

Build everything:

    make

Test everything:

    make test

Run a specific test suite:

    make test-integration
    make test-integration-node
    make test-integration-browser

Remove all build and testing artifacts:

    make clean

[Node.js]: https://nodejs.org/
[Browserify]: http://browserify.org/

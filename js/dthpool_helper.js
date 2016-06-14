/*jslint node: true */
"use strict";

var async = require('async');
var ethConnector = require('./eth_connector');

exports.deployDTHPool = function(opts, cb) {
    var compilationResult;
    return async.waterfall([
        function(cb) {
            ethConnector.loadSol("DTHPool.sol", cb);
        },
        function(src, cb) {
            ethConnector.compile(src, cb);
        },
        function(result, cb) {
            compilationResult = result;
            ethConnector.deploy(compilationResult.DTHPool.interface,
                compilationResult.DTHPool.bytecode,
                0,
                0,
                opts.daoAddress,
                opts.delegate,
                opts.maxTimeBlocked,
                opts.delegateName,
                opts.delegateUrl,
                opts.tokenSymbol,
                cb);
        },
    ], function(err, dthPool) {
        if (err) return cb(err);
        cb(null,dthPool, compilationResult);
    });
};





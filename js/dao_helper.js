/*jslint node: true */
"use strict";

var async = require('async');
var ethConnector = require('./eth_connector');

exports.deployDAO = function(opts, cb) {
    var compilationResult;
    var daoCreator;
    var dao;
    return async.waterfall([
        function(cb) {
            ethConnector.loadSol("DAO.sol", cb);
        },
        function(src, cb) {
            ethConnector.applyConstants(src, opts, cb);
        },
        function(src, cb) {
            ethConnector.compile(src, cb);
        },
        function(result, cb) {
            compilationResult = result;
            ethConnector.deploy(compilationResult.DAO_Creator.interface,
                compilationResult.DAO_Creator.bytecode,
                0,
                0,
                cb);
        },
        function(aDaoCreator, cb) {
            daoCreator = aDaoCreator;
            ethConnector.deploy(compilationResult.DAO.interface,
                compilationResult.DAO.bytecode,
                0,
                0,
                opts.curator,
                daoCreator.address,
                opts.proposalDeposit,
                opts.minTokensToCreate,
                opts.closingTime,
                opts.privateCreation,
                opts.tokenName,
                opts.tokenSymbol,
                opts.decimalPlaces,
                cb);
        }
    ], function(err, aDao) {
        dao = aDao;
        if (err) return cb(err);
        cb(null,dao, daoCreator, compilationResult);
    });
};





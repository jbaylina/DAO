/*jslint node: true */
/*global describe, it, before, beforeEach, after, afterEach */
"use strict";

var daoHelper = require('../js/dao_helper.js');
var dthPoolHelper = require('../js/dthpool_helper.js');
var ethConnector = require('../js/eth_connector');
var assert = require("assert"); // node.js core module
var async = require('async');
var _ = require('lodash');

describe('DTHPool Test', function(){
    var dao;
    var dthPool;
    var closingTime;
    var proposalTime;
    before(function(done) {
        ethConnector.init('testrpc',done);
    });
    it('should deploy a test dao', function(done){
        this.timeout(40000);
        closingTime = Math.floor(new Date().getTime() / 1000) + 30;
        daoHelper.deployDAO({
            curator: ethConnector.accounts[0],
            proposalDeposit: ethConnector.web3.toWei(2),
            minTokensToCreate: ethConnector.web3.toWei(1),
            closingTime: closingTime,     // Will Close in 30 secs

            privateCreation: 0,
            tokenName: "testDAO Token",
            tokenSymbol: 'tÐ',
            decimalPlaces:16,
            minProposalDebatePeriod: 1,
            minSplitDebatePeriod: 1,
            creationGracePeriod: 1
        }, function(err, _dao, _daoCreator) {
            assert.ifError(err);
            assert.ok(_daoCreator.address);
            assert.ok(_dao.address);
            dao = _dao;
            done();
        });
    });
    it('Should fuel deterministically the DAO', function(done) {
        this.timeout(50000);
        async.series([
            function sendEtherToTheDAO(cb) {
                async.each(_.range(5), function(idx, cb) {
                    ethConnector.web3.eth.sendTransaction({
                        from: ethConnector.accounts[idx],
                        to: dao.address,
                        gas:1000000,
                        value: ethConnector.web3.toWei((idx+1)*10*1.5, "ether")
                    }, cb);
                }, cb);
            },
            function waitUntilClosingTime(cb) {
                var now = Math.floor(new Date().getTime() / 1000);
                setTimeout(cb, (5+ closingTime - now)*1000) ;
            },
            function readFueled(cb) {
                dao.isFueled(function(err, isFueled) {
                    assert.ifError(err);
                    assert.ok(isFueled);
                    cb();
                });
            },
            function readBalances(cb) {
                async.each(_.range(5), function(idx, cb) {
                    dao.balanceOf(ethConnector.accounts[idx], function(err, balance) {
                        assert.ifError(err);
                        assert.equal(parseFloat(ethConnector.web3.fromWei(balance)), (idx+1)*10);
                        cb();
                    });
                },cb);
            },
            function readTotalSupply(cb) {
                dao.totalSupply(function(err, totalSupply) {
                    assert.ifError(err);
                    assert.equal(parseFloat(ethConnector.web3.fromWei(totalSupply)), 150);
                    cb();
                });
            }
        ], done);
    });
    it('Should deploy DTHPool contract', function(done) {
        this.timeout(30000);
        dthPoolHelper.deployDTHPool({
            daoAddress: dao.address,
            delegate: ethConnector.accounts[1],
            maxTimeBlocked: 15,
            delegateName: "test",
            delegateUrl: "http://test.io",
            tokenSymbol: "dtÐ"
        }, function(err, _dthPool) {
            assert.ifError(err);
            assert.ok(_dthPool.address);
            dthPool = _dthPool;
            done();
        });
    });
    it('Should delegate votes correctly', function(done) {
        async.series([
            function approve(cb) {
                dao.approve.sendTransaction(
                    dthPool.address,
                    ethConnector.web3.toWei(3),
                    {
                        from: ethConnector.accounts[0],
                        gas: 1000000
                    },
                    function(err) {
                        assert.ifError(err);
                        cb();
                    }
                );
            },
            function delegate(cb) {
                dthPool.delegateDAOTokens.sendTransaction(
                    ethConnector.web3.toWei(3) ,
                    {
                        from: ethConnector.accounts[0],
                        gas: 1000000
                    },
                    function(err) {
                        assert.ifError(err);
                        async.series([
                            function(cb) {
                                dao.balanceOf(ethConnector.accounts[0], function(err, balance) {
                                    assert.ifError(err);
                                    assert.equal(parseFloat(ethConnector.web3.fromWei(balance)), 7);
                                    cb();
                                });
                            },
                            function(cb) {
                                dthPool.balanceOf(ethConnector.accounts[0], function(err, balance) {
                                    assert.ifError(err);
                                    assert.equal(parseFloat(ethConnector.web3.fromWei(balance)), 3);
                                    cb();
                                });
                            }
                        ], cb);
                    }
                );
            }
        ],done);
    });
    it('Should undelegate votes correctly', function(done) {
        dthPool.undelegateDAOTokens(
            ethConnector.web3.toWei(1),
            {
                from: ethConnector.accounts[0],
                gas: 1000000
            },
            function(err) {
                assert.ifError(err);
                async.series([
                    function(cb) {
                        dao.balanceOf(ethConnector.accounts[0], function(err, balance) {
                            assert.ifError(err);
                            assert.equal(parseFloat(ethConnector.web3.fromWei(balance)), 8);
                            cb();
                        });
                    },
                    function(cb) {
                        dthPool.balanceOf(ethConnector.accounts[0], function(err, balance) {
                            assert.ifError(err);
                            assert.equal(parseFloat(ethConnector.web3.fromWei(balance)), 2);
                            cb();
                        });
                    }
                ], done);
            }
        );
    });
    it('Should Create a proposal and set intention', function(done) {
        async.series([
            function createProposal(cb) {
                proposalTime = Math.floor(new Date().getTime() / 1000);
                dao.newProposal.sendTransaction(
                    ethConnector.accounts[0],
                    ethConnector.web3.toWei(20,'ether'),
                    "proposal1",
                    0,
                    30,
                    false,
                    {
                        from: ethConnector.accounts[0],
                        gas: 1000000,
                        value: ethConnector.web3.toWei(2,'ether')
                    },
                    function(err) {
                        assert.ifError(err);
                        cb();
                    }
                );
            },
            function setVoteIntention(cb) {
                dthPool.setVoteIntention.sendTransaction(
                    1,
                    true,
                    false,
                    "test motivation",
                    {
                        from: ethConnector.accounts[1],
                        gas: 1000000
                    },
                    function(err) {
                        assert.ifError(err);
                        dthPool.proposalStatuses(1, function(err, status) {
                            assert.ifError(err);
                            assert.equal(status[0], true);
                            assert.equal(status[1], true);
                            assert.equal(status[2], false);
                            assert.equal(status[3], false);
                            assert.equal(status[5], "test motivation");
                            cb();
                        });
                    }
                );
            }
        ], done);
    });
    it('Should not allow vote into the DAO before time', function(done) {
        dthPool.executeVote.sendTransaction(
            1,
            {
                from: ethConnector.accounts[2],
                gas: 1000000
            },
            function(err) {
                assert.ifError(err);
                dao.proposals(1, function(err, proposal) {
                    assert.ifError(err);
                    assert.equal(parseFloat(ethConnector.web3.fromWei(proposal[9])), 0);
                    assert.equal(parseFloat(ethConnector.web3.fromWei(proposal[10])), 0);
                });
                done();
            }
        );
    });
    it('Should Execute vote into the DAO', function(done) {
        this.timeout(60000);
        async.series([
            function waitUntilCanVote(cb) {
                var now = Math.floor(new Date().getTime() / 1000);
                setTimeout(cb, (proposalTime + 20 - now)*1000) ;
            },
            function executeVote(cb) {
                dthPool.executeVote.sendTransaction(
                    1,
                    {
                        from: ethConnector.accounts[2],
                        gas: 1000000
                    },
                    cb
                );
            }
        ], function(err) {
            assert.ifError(err);
            dao.proposals(1, function(err, proposal) {
                assert.ifError(err);
                assert.equal(parseFloat(ethConnector.web3.fromWei(proposal[9])), 0);
                assert.equal(parseFloat(ethConnector.web3.fromWei(proposal[10])), 2);
            });
            done();
        });
    });
});

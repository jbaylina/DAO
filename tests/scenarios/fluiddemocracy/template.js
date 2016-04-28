var dao = web3.eth.contract($dao_abi).at('$dao_address');

checkWork();

var filter = web3.eth.filter('latest');

var pendingWaits = [];
filter.watch(function (error, blockHash) {
    var block = eth.getBlock(blockHash);
    bn = block.number;

    var i=0;
    while (i<pendingWaits.length) {
        var cur = pendingWaits[i];
        if (cur.block<=bn) {
            var last  = pendingWaits.pop();
            if (last !== cur) {
                pendingWaits[i] = last;
            }
            cur.cb();
        } else {
            i+=1;
        }
    }
});

function waitBlock(cb) {
    var pendingWait = {
        block: eth.blockNumber + 5,
        cb: cb
    };
    pendingWaits.push(pendingWait);
}


function run(actions, cb) {

    var endAction = function(err, res) {
        if (idx >=0) {
            if (err) {
                console.log("Error in step: " + idx + "err:" + err);
                return cb(err);
            }
            if (actions[idx].action==="V") {
                addToTest('y' + actions[idx].step, parseInt(web3.fromWei(dao.proposals(actions[idx].proposal)[9])));
                addToTest('n' + actions[idx].step, parseInt(web3.fromWei(dao.proposals(actions[idx].proposal)[10])));
            }
            if (typeof actions[idx].test === "function") {
                actions[idx].test(actions[idx]);
            }
        }
        idx += 1;
        if (idx == actions.length) {
            return cb();
        }
        exec_pos(idx);
    };

    var exec_pos = function(idx) {
        if (actions[idx].action === "V") {
            console.log("Voting Step: " + actions[idx].step);
            dao.vote.sendTransaction(actions[idx].proposal, actions[idx].supports, {from: eth.accounts[actions[idx].account], gas: 1000000}, function(err) {
                if (err) return endAction(err);
                waitBlock(endAction);
            });
        } else if (actions[idx].action === "P") {
            console.log("Creating Proposal: " + actions[idx].step);
            dao.newProposal.sendTransaction(eth.accounts[0], web3.toWei(20,'ether'), "proposal1", 0, 120, false, {from: eth.accounts[0], gas: 1000000, value: web3.toWei(25,'ether')}, function(err) {
                if (err) return endAction(err);
                waitBlock(endAction);
            });
        } else if (actions[idx].action === "D") {
            console.log("Delegating step: " + actions[idx].step);
            dao.setDelegate.sendTransaction( eth.accounts[ actions[idx].delegate] , {from: eth.accounts[actions[idx].account], gas: 1000000  }, function(err) {
                if (err) return endAction(err);
                waitBlock(endAction);
            });
        }

    };

    var idx =-1;
    endAction();
}


var steps = [
    { step: 1, action:"P", proposal: 1},
    { step: 2, action:"V", account: 0 , proposal: 1, supports: true},
    { step: 3, action:"V", account: 1 , proposal: 1, supports: false},
    { step: 4, action:"V", account: 2 , proposal: 1, supports: true},
    { step: 5, action:"V", account: 3 , proposal: 1, supports: false},
    { step: 6, action:"V", account: 4 , proposal: 1, supports: false},
    { step: 7, action:"V", account: 5 , proposal: 1, supports: false},
    { step: 8, action:"V", account: 0 , proposal: 1, supports: false},
    { step: 9, action:"D", account: 2 , delegate: 5},
    { step: 10, action:"D", account: 3 , delegate: 5, test: function() {
        addToTest( "s10_delegated_votes_def_before",  parseInt(web3.fromWei(dao.getDelegateVotingRights(0,1))));
        addToTest( "s10_delegated_votes_def_after",  parseInt(web3.fromWei(dao.getDelegateVotingRights(0,2))));
        addToTest( "s10_delegated_votes_0_before",  parseInt(web3.fromWei(dao.getDelegateVotingRights(eth.accounts[0],1))));
        addToTest( "s10_delegated_votes_0_after",  parseInt(web3.fromWei(dao.getDelegateVotingRights(eth.accounts[0],2))));
        addToTest( "s10_delegated_votes_5_before",  parseInt(web3.fromWei(dao.getDelegateVotingRights(eth.accounts[5],1))));
        addToTest( "s10_delegated_votes_5_after",  parseInt(web3.fromWei(dao.getDelegateVotingRights(eth.accounts[5],2))));
    }},
    { step: 11, action:"P", proposal: 2},
    { step: 12, action:"V", account: 5 , proposal: 2, supports: true},
    { step: 13, action:"V", account: 2 , proposal: 2, supports: false},
    { step: 14, action:"V", account: 3 , proposal: 2, supports: false},
    { step: 15, action:"V", account: 0 , proposal: 2, supports: true},
    { step: 16, action:"V", account: 4 , proposal: 2, supports: false},
];

miner.start();

run(steps, function() {
    filter.stopWatching();
    testResults();
    miner.stop();
});

console.log("Wait for end of debating period");


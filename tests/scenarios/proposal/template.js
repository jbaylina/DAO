var dao = web3.eth.contract($dao_abi).at('$dao_address');
var offer = web3.eth.contract($offer_abi).at('$offer_address');

console.log("Add offer contract as allowed recipient");
dao.changeAllowedRecipients.sendTransaction('$offer_address', true, {from: curator, gas: 1000000});
checkWork();

if ($should_halve_minquorum) {
    console.log("Calling dao.halveMinQuorum()");
    dao.halveMinQuorum.sendTransaction({from: eth.accounts[0], gas: 1000000});
}

addToTest('creator_balance_before', web3.fromWei(eth.getBalance(proposalCreator)));
var prop_id = attempt_proposal(
    dao, // DAO in question
    '$offer_address', // recipient
    contractor, // proposal creator
    $offer_amount, // proposal amount in ether
    '$offer_desc', // description
    '$transaction_bytecode', //bytecode
    $debating_period, // debating period
    $proposal_deposit, // proposal deposit in ether
    false // whether it's a split proposal or not
);

addToTest('creator_balance_after_proposal', web3.fromWei(eth.getBalance(contractor)));
addToTest(
    'calculated_deposit',
    bigDiffRound(testMap['creator_balance_before'], testMap['creator_balance_after_proposal'])
);
addToTest('dao_proposals_number', dao.numberOfProposals());

var votes = $votes;
console.log("Deadline is: " + dao.proposals(prop_id)[3] + " Voting ... ");
for (i = 0; i < votes.length; i++) {
    console.log("User " + i +" is voting ["+ votes[i] +"]. His token balance is: " + web3.fromWei(dao.balanceOf(eth.accounts[i])) + " ether and NOW is: " + Math.floor(Date.now() / 1000));
    dao.vote.sendTransaction(
        prop_id,
        votes[i],
        {
            from: eth.accounts[i],
            gas: 1000000
        }
    );
}
checkWork();
addToTest('proposal_yay', parseInt(web3.fromWei(dao.proposals(prop_id)[9])));
addToTest('proposal_nay', parseInt(web3.fromWei(dao.proposals(prop_id)[10])));
addToTest('contractor_balance_before', web3.fromWei(eth.getBalance(contractor)));

setTimeout(function() {
    miner.stop();
    console.log("After debating period. NOW is: " + Math.floor(Date.now() / 1000));
    attempt_execute_proposal(
        dao, // target DAO
        prop_id, // proposal ID
        '$transaction_bytecode', // transaction bytecode
        contractor, // proposal creator
        true, // should the proposal be closed after this call?
        true // should the proposal pass?
    );

    addToTest('creator_balance_after_execution', web3.fromWei(eth.getBalance(contractor)));
    addToTest('contractor_balance_after', web3.fromWei(eth.getBalance(contractor).minus(web3.toWei($proposal_deposit))));

    addToTest(
        'onetime_costs',
        bigDiffRound(testMap['contractor_balance_after'], testMap['contractor_balance_before'])
    );
    addToTest(
        'deposit_returned',
        Math.round(testMap['creator_balance_after_execution']) == Math.round(testMap['creator_balance_before'])
    );
    addToTest('offer_promise_valid', offer.isContractValid());

    testResults();
}, $debating_period * 1000);
console.log("Wait for end of debating period");
miner.start(1);

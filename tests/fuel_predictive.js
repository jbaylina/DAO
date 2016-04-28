console.log('unlocking accounts');
personal.unlockAccount(eth.accounts[0], '123');
personal.unlockAccount(eth.accounts[1], '123');
personal.unlockAccount(eth.accounts[2], '123');
personal.unlockAccount(eth.accounts[3], '123');
personal.unlockAccount(eth.accounts[4], '123');
personal.unlockAccount(eth.accounts[5], '123');
// set the basic accounts, coinbase should be random so mining rewards don't pollute results
var curator = eth.accounts[0];
var proposalCreator = eth.accounts[1];
var etherBase = '0x9999999999999999999999999999999999999999';
web3.miner.setEtherbase(etherBase);

var testMap = {};

function checkWork() {
    miner.start(1);
    admin.sleepBlocks(3);
    miner.stop();
}

function time_now() {
    return Math.floor(Date.now() / 1000);
}

function bigDiff(astr, bstr) {
    return new BigNumber(astr).minus(new BigNumber(bstr));
}

function bigDiffRound(astr, bstr) {
    return Math.round(bigDiff(astr, bstr));
}

function addToTest(name, value) {
    testMap[name] = value;
    console.log("'" + name + "' = " + value);
}

function testResults() {
    console.log("Test Results: " + JSON.stringify(testMap));
}

function testFail(str) {
    console.log("TEST FAIL: " + str);
    throw ' ';
}

function attempt_proposal(
    argdao,
    recipient,
    proposal_creator,
    ether_amount,
    desc,
    bytecode,
    debating_period,
    ether_deposit,
    is_split_proposal
    ) {

    dao_closing_time = argdao.closingTime();

    if (!argdao.isFueled()) {
        testFail(
            "Failed to create a proposal to: '" + desc + "' because the DAO "
            + "is not fueled."
        );
    }
    if (dao_closing_time.gt(time_now())) {
        testFail(
            "Failed to create a proposal to: '" + desc + "' because the DAO's "
            + "creation time has not yet closed.\ndao_closing_time: "
            + dao_closing_time + "\nnow(): " + time_now()
        );
    }
    proposals_num_before = argdao.numberOfProposals();
    console.log("Creating a new proposal to: '" + desc + "'");
    console.log("recipient: " + recipient);
    console.log("amount: " + web3.toWei(ether_amount, "ether"));
    console.log("desc: " + desc);
    console.log("bytecode: " + bytecode);
    console.log("debating_period: " + debating_period);
    console.log("is_split_proposal: " + is_split_proposal);
    console.log("from: " + proposal_creator);
    console.log("value: " + web3.toWei(ether_deposit, "ether"));
    argdao.newProposal.sendTransaction(
    recipient,
    web3.toWei(ether_amount, "ether"),
    desc,
    bytecode,
    debating_period,
    is_split_proposal,
    {
        from: proposal_creator,
        value: web3.toWei(ether_deposit, "ether"),
        gas: 1000000
    });
    checkWork();
    proposals_num_now = argdao.numberOfProposals();

    if (!proposals_num_now.equals(proposals_num_before.add(1))) {
        testFail("Failed to create a proposal to: " + desc + "'");
    } else {
        console.log("Proposal succesfully created");
    }
    return proposals_num_now;
}

function attempt_split(argdao, prop_id, user, new_curator, split_exec_period) {
    console.log("Account '" + user + "' is calling splitDAO()");
    var vote_deadline = argdao.proposals(prop_id)[3];
    if (vote_deadline.gt(time_now())) {
        testFail("Can't split the DAO while the proposal is still debated.");
    }
    var prop_deadline = vote_deadline.add(split_exec_period);
    console.log("prop_deadline: " + prop_deadline);
    console.log("now(): " + time_now());
    if (prop_deadline.lessThan(time_now() + 5)) {
        testFail("Can no longer vote to split the DAO. 'now > p.votingDeadline + splitExecutionPeriod'");
    }
    argdao.splitDAO.sendTransaction(
        prop_id,
        new_curator,
        {from:user, gas: 4700000});
    checkWork();
    console.log("Account '" + user + "' called splitDAO() succesfully");
}

function attempt_execute_proposal(
    argdao,
    prop_id,
    bytecode,
    prop_creator,
    expect_closed,
    expect_pass) {
    desc = argdao.proposals(prop_id)[2];
    vote_deadline = argdao.proposals(prop_id)[3];
    console.log("Attempting to execute proposal for: '" +desc +"'.");

    if (vote_deadline.gt(time_now())) {
        testFail("Can't execute a proposal whilte it is is still debated.");
    }

    argdao.executeProposal.sendTransaction(
        prop_id,
        bytecode,
        {from: prop_creator, gas:4700000}
    );
    checkWork();
    if (argdao.proposals(prop_id)[4] == expect_closed) {
        testFail(
            "Failed to execute proposal for: '" +desc +"'. Expected the " +
            "proposal to be " + (expect_closed ? "closed" : "open") +
            " but it's not"
        );
    }
    if (argdao.proposals(prop_id)[5] != expect_pass) {
        testFail(
            "Expected the proposal for: '" +desc +" to " +
            (expect_pass ? "pass" : "fail") + "."
        );
    }
    console.log("Executed proposal: '" + desc + "'.");
}

var amounts = [ 10, 20, 30, 40, 50 ];
var dao = web3.eth.contract([{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"proposals","outputs":[{"name":"recipient","type":"address"},{"name":"amount","type":"uint256"},{"name":"description","type":"string"},{"name":"votingDeadline","type":"uint256"},{"name":"open","type":"bool"},{"name":"proposalPassed","type":"bool"},{"name":"proposalHash","type":"bytes32"},{"name":"proposalDeposit","type":"uint256"},{"name":"newCurator","type":"bool"},{"name":"yea","type":"uint256"},{"name":"nay","type":"uint256"},{"name":"creator","type":"address"}],"type":"function"},{"constant":true,"inputs":[{"name":"pid","type":"uint256"},{"name":"sid","type":"uint256"}],"name":"splitProposalNewAddress","outputs":[{"name":"_DAO","type":"address"}],"type":"function"},{"constant":false,"inputs":[{"name":"_spender","type":"address"},{"name":"_amount","type":"uint256"}],"name":"approve","outputs":[{"name":"success","type":"bool"}],"type":"function"},{"constant":true,"inputs":[],"name":"minTokensToCreate","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[],"name":"rewardAccount","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":true,"inputs":[{"name":"_tokenHolder","type":"address"},{"name":"_proposalID","type":"uint256"}],"name":"getTokenHolderVotingRights","outputs":[{"name":"votes","type":"uint256"},{"name":"delegate","type":"address"}],"type":"function"},{"constant":true,"inputs":[],"name":"daoCreator","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[],"name":"divisor","outputs":[{"name":"divisor","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[],"name":"extraBalance","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":false,"inputs":[{"name":"_proposalID","type":"uint256"},{"name":"_transactionData","type":"bytes"}],"name":"executeProposal","outputs":[{"name":"_success","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFrom","outputs":[{"name":"success","type":"bool"}],"type":"function"},{"constant":true,"inputs":[],"name":"totalRewardToken","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[],"name":"actualBalance","outputs":[{"name":"_actualBalance","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_newDefaultDelegate","type":"address"}],"name":"newDefaultDelegate","outputs":[],"type":"function"},{"constant":true,"inputs":[],"name":"closingTime","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"allowedRecipients","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferWithoutReward","outputs":[{"name":"success","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"pid","type":"uint256"},{"name":"sid","type":"uint256"}],"name":"splitProposalBalance","outputs":[{"name":"_balance","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[],"name":"refund","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"_delegate","type":"address"},{"name":"_proposalID","type":"uint256"}],"name":"getDelegateVotingRights","outputs":[{"name":"votes","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_recipient","type":"address"},{"name":"_amount","type":"uint256"},{"name":"_description","type":"string"},{"name":"_transactionData","type":"bytes"},{"name":"_debatingPeriod","type":"uint256"},{"name":"_newCurator","type":"bool"}],"name":"newProposal","outputs":[{"name":"_proposalID","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"DAOpaidOut","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[],"name":"minQuorumDivisor","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_newContract","type":"address"}],"name":"newContract","outputs":[],"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"}],"name":"balanceOf","outputs":[{"name":"balance","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_recipient","type":"address"},{"name":"_allowed","type":"bool"}],"name":"changeAllowedRecipients","outputs":[{"name":"_success","type":"bool"}],"type":"function"},{"constant":false,"inputs":[],"name":"halveMinQuorum","outputs":[{"name":"_success","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"paidOut","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_proposalID","type":"uint256"},{"name":"_newCurator","type":"address"}],"name":"splitDAO","outputs":[{"name":"_success","type":"bool"}],"type":"function"},{"constant":true,"inputs":[],"name":"DAOrewardAccount","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":true,"inputs":[],"name":"proposalDeposit","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[],"name":"numberOfProposals","outputs":[{"name":"_numberOfProposals","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[],"name":"lastTimeMinQuorumMet","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_toMembers","type":"bool"}],"name":"retrieveDAOReward","outputs":[{"name":"_success","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"_val","type":"uint256"}],"name":"extMinQuorum","outputs":[{"name":"_minQuorum","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[],"name":"receiveEther","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"success","type":"bool"}],"type":"function"},{"constant":true,"inputs":[],"name":"isFueled","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[{"name":"_tokenHolder","type":"address"}],"name":"createTokenProxy","outputs":[{"name":"success","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"_proposalID","type":"uint256"}],"name":"getNewDAOAddress","outputs":[{"name":"_newDAO","type":"address"}],"type":"function"},{"constant":false,"inputs":[{"name":"_proposalID","type":"uint256"},{"name":"_supportsProposal","type":"bool"}],"name":"vote","outputs":[{"name":"_voteID","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_delegate","type":"address"}],"name":"setDelegate","outputs":[{"name":"","type":"bool"}],"type":"function"},{"constant":false,"inputs":[],"name":"getMyReward","outputs":[{"name":"_success","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"","type":"address"}],"name":"rewardToken","outputs":[{"name":"","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"pid","type":"uint256"},{"name":"sid","type":"uint256"}],"name":"splitProposalrewardToken","outputs":[{"name":"_rewardToken","type":"uint256"}],"type":"function"},{"constant":true,"inputs":[{"name":"pid","type":"uint256"},{"name":"sid","type":"uint256"}],"name":"splitProposalSupply","outputs":[{"name":"_supply","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_from","type":"address"},{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transferFromWithoutReward","outputs":[{"name":"success","type":"bool"}],"type":"function"},{"constant":true,"inputs":[{"name":"_owner","type":"address"},{"name":"_spender","type":"address"}],"name":"allowance","outputs":[{"name":"remaining","type":"uint256"}],"type":"function"},{"constant":false,"inputs":[{"name":"_proposalDeposit","type":"uint256"}],"name":"changeProposalDeposit","outputs":[],"type":"function"},{"constant":true,"inputs":[],"name":"curator","outputs":[{"name":"","type":"address"}],"type":"function"},{"constant":true,"inputs":[{"name":"_proposalID","type":"uint256"},{"name":"_recipient","type":"address"},{"name":"_amount","type":"uint256"},{"name":"_transactionData","type":"bytes"}],"name":"checkProposalCode","outputs":[{"name":"_codeChecksOut","type":"bool"}],"type":"function"},{"constant":true,"inputs":[],"name":"privateCreation","outputs":[{"name":"","type":"address"}],"type":"function"},{"inputs":[{"name":"_curator","type":"address"},{"name":"_defaultDelegate","type":"address"},{"name":"_daoCreator","type":"address"},{"name":"_proposalDeposit","type":"uint256"},{"name":"_minTokensToCreate","type":"uint256"},{"name":"_closingTime","type":"uint256"},{"name":"_privateCreation","type":"address"}],"type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_from","type":"address"},{"indexed":true,"name":"_to","type":"address"},{"indexed":false,"name":"_amount","type":"uint256"}],"name":"Transfer","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_owner","type":"address"},{"indexed":true,"name":"_spender","type":"address"},{"indexed":false,"name":"_amount","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"name":"value","type":"uint256"}],"name":"FuelingToDate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"amount","type":"uint256"}],"name":"CreatedToken","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"to","type":"address"},{"indexed":false,"name":"value","type":"uint256"}],"name":"Refund","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"proposalID","type":"uint256"},{"indexed":false,"name":"recipient","type":"address"},{"indexed":false,"name":"amount","type":"uint256"},{"indexed":false,"name":"newCurator","type":"bool"},{"indexed":false,"name":"description","type":"string"}],"name":"ProposalAdded","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"proposalID","type":"uint256"},{"indexed":false,"name":"position","type":"bool"},{"indexed":true,"name":"voter","type":"address"}],"name":"Voted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"proposalID","type":"uint256"},{"indexed":false,"name":"result","type":"bool"},{"indexed":false,"name":"quorum","type":"uint256"}],"name":"ProposalTallied","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_newCurator","type":"address"}],"name":"NewCurator","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_newDefaultDelegate","type":"address"}],"name":"NewDefaultDelegate","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"_recipient","type":"address"},{"indexed":false,"name":"_allowed","type":"bool"}],"name":"AllowedRecipientChanged","type":"event"}]
).at('0xbd46690bca9101fe5a45ecc02bd3a1d9ef18faf7');
console.log("Creating DAO tokens");

if (eth.accounts.length<5) {
    console.log("For this test, at least 5 accounts must be created.");
}
for (i = 0; i < amounts.length; i++) {
    web3.eth.sendTransaction({
        from:eth.accounts[i],
        to: dao.address,
        gas:200000,
        value:web3.toWei(amounts[i], "ether")
    } /* , function(err, res) {
        if (err) {
            console.log(err);
        }
        console.log("succes: " + res);
    } */);
//    console.log(amounts[i]);
}

checkWork();

setTimeout(function() {
    miner.stop();
    addToTest('dao_fueled', dao.isFueled());
    addToTest('total_supply', parseFloat(web3.fromWei(dao.totalSupply())));
    var balances = [];
    for (i = 0; i < amounts.length; i++) {
        balances.push(parseFloat(web3.fromWei(dao.balanceOf(eth.accounts[i]))));
    }
    addToTest('balances', balances);

    testResults();
}, 29000);
console.log("Wait for end of creation");
miner.start(1);

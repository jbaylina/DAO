import random
from utils import arr_str, create_votes_array

scenario_description = (
    "This scenario alternates varios createProposal, vote, transfer,"
    " setDelegate in various tokenHolders/delegates."
    " It checks that all the votes are countent in the correct way after each"
    " action"
)




def run(ctx):
    ctx.assert_scenario_ran('fuel_predictive')

    minamount = 2  # is determined by the total costs + one time costs
    amount = random.randint(minamount, sum(ctx.token_amounts))
    ctx.create_js_file(substitutions={
        "dao_abi": ctx.dao_abi,
        "dao_address": ctx.dao_addr,
        "offer_abi": ctx.offer_abi,
        "offer_address": ctx.offer_addr,
        "offer_amount": amount,
        "offer_desc": 'Test Proposal',
        "proposal_deposit": ctx.args.proposal_deposit,
        "transaction_bytecode": '0x2ca15122',  # solc --hashes SampleOffer.sol
        "debating_period": ctx.args.proposal_debate_seconds,
    })

    ctx.execute(expected={
        "y2": 150,
        "n2": 0,
        "y3": 130,
        "n3": 20,
        "y4": 130,
        "n4": 20,
        "y5": 90,
        "n5": 60,
        "y6": 40,
        "n6": 110,
        "y7": 40,
        "n7": 110,
        "y8": 40,
        "n8": 110,
        "s10_delegated_votes_def_before": 150,
        "s10_delegated_votes_def_after": 80,
        "s10_delegated_votes_0_before": 0,
        "s10_delegated_votes_0_after": 0,
        "s10_delegated_votes_5_before": 0,
        "s10_delegated_votes_5_after": 70,
        "y12": 70,
        "n12": 0,
        "y13": 40,
        "n13": 30
    })

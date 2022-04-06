import { BigInt } from "@graphprotocol/graph-ts";
import { VoteChange } from "../generated/VotingVault/VotingVault";
import {
  Delegation,
  Delegator,
  VoteChangeEvent,
  Voter,
} from "../generated/schema";

export function handleVoteChange(event: VoteChange): void {
  // Create a VoteChangeEvent
  const id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  const eventObject = new VoteChangeEvent(id);

  // Check if Voter exists
  // create voter
  const voter = ensureVoter(event.params.to.toHexString());

  // Check if Delegator exists
  // create delegate
  const delegator = ensureDelegator(event.params.from.toHexString());

  // Check if Delegation Exists
  // create delegation
  const delegation = ensureDelegation(delegator, voter);

  // complete eventObject creation
  eventObject.to = voter.id;
  eventObject.delegation = delegation.id;
  eventObject.amount = event.params.amount;
  eventObject.timestamp = event.block.timestamp;
  eventObject.save();

  // update voting power
  voter.votingPower = voter.votingPower.plus(event.params.amount);
  voter.save();

  // Update delegator count
  // Is current delegation net +ve
  const wasDelegationCounted = delegation.amount.gt(BigInt.zero());
  // Update Delegation, check net amount
  delegation.amount = delegation.amount.plus(event.params.amount);
  delegation.save();

  const isDelegationCounted = delegation.amount.gt(BigInt.zero());
  // If Delegation was 0, and now +ve add one to Voter.numberOfDelegations
  if (isDelegationCounted && !wasDelegationCounted) {
    voter.numberOfDelegations = voter.numberOfDelegations.plus(
      BigInt.fromI32(1)
    );
    voter.save();
  }
  // If delegation was +ve, and now 0 subtract one from Voter.numberOfDelegations
  if (!isDelegationCounted && wasDelegationCounted) {
    voter.numberOfDelegations = voter.numberOfDelegations.minus(
      BigInt.fromI32(1)
    );
    voter.save();
  }
}

function ensureVoter(address: string): Voter {
  let voter = Voter.load(address);

  if (!voter) {
    voter = new Voter(address);
    voter.votingPower = BigInt.zero();
    voter.save();
  }
  return voter;
}

function ensureDelegator(address: string): Delegator {
  let delegator = Delegator.load(address);

  if (!delegator) {
    delegator = new Delegator(address);
    delegator.save();
  }

  return delegator;
}

function ensureDelegation(delegator: Delegator, voter: Voter): Delegation {
  let id = delegator.id + "-" + voter.id;

  let delegation = Delegation.load(id);

  if (!delegation) {
    delegation = new Delegation(id);
    delegation.voter = voter.id;
    delegation.delegator = delegator.id;
    delegation.amount = BigInt.zero();
    delegation.save;
  }

  return delegation;
}

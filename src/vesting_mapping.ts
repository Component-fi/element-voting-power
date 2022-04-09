import { VoteChange as VestingVoteChange } from "../generated/VestingVault/VestingVault";
import { VoteChangeEvent } from "../generated/schema";
import { ensureDelegation, ensureDelegator, ensureVoter } from "./mapping";
import { BigInt } from "@graphprotocol/graph-ts";

export function handleVestingVoteChange(event: VestingVoteChange): void {
  const id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();
  const eventObject = new VoteChangeEvent(id);

  eventObject.vault = "Vesting";

  eventObject.amount = event.params.amount;
  eventObject.timestamp = event.block.timestamp;
  // Check if Voter exists
  // create voter
  const voter = ensureVoter(event.params.to.toHexString());
  eventObject.to = voter.id;

  // Check if Delegator exists
  // create delegate
  const delegator = ensureDelegator(event.params.from.toHexString());
  eventObject.from = delegator.id;

  // Check if Delegation Exists
  // create delegation
  const delegation = ensureDelegation(delegator, voter);
  eventObject.delegation = delegation.id;
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

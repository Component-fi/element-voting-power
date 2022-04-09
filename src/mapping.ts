import { BigInt } from "@graphprotocol/graph-ts";
import { Delegation, Delegator, Voter } from "../generated/schema";

export function ensureVoter(address: string): Voter {
  let voter = Voter.load(address);

  if (!voter) {
    voter = new Voter(address);
    voter.votingPower = BigInt.zero();
    voter.save();
  }
  return voter;
}

export function ensureDelegator(address: string): Delegator {
  let delegator = Delegator.load(address);

  if (!delegator) {
    delegator = new Delegator(address);
    delegator.save();
  }

  return delegator;
}

export function ensureDelegation(
  delegator: Delegator,
  voter: Voter
): Delegation {
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

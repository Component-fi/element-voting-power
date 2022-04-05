import { BigInt } from "@graphprotocol/graph-ts";
import { VoteChange } from "../generated/VotingVault/VotingVault";
import { VoteChangeEvent, Voter } from "../generated/schema";

export function handleVoteChange(event: VoteChange): void {
  const id = event.transaction.hash.toHex() + "-" + event.logIndex.toString();

  const eventObject = new VoteChangeEvent(id);

  eventObject.from = ensureVoter(event.params.from.toHexString()).id;

  const toVoter = ensureVoter(event.params.to.toHexString());
  toVoter.votingPower = toVoter.votingPower.plus(event.params.amount);
  toVoter.save();
  eventObject.to = toVoter.id;

  eventObject.amount = event.params.amount;
  eventObject.save();
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

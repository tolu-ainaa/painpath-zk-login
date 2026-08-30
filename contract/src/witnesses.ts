/*
 * The private state of the PainPath ZK login, and the single witness that
 * reads it.
 *
 * In the portal this is backed by LevelPrivateStateProvider, which encrypts at
 * rest. The secret is 256 bits of crypto-random entropy generated in the
 * browser — never a human-chosen password, and never sent to a server.
 */

import { Ledger } from "./managed/painpath/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

export type PainPathPrivateState = {
  readonly secret: Uint8Array;
};

export const createPainPathPrivateState = (
  secret: Uint8Array,
): PainPathPrivateState => ({ secret });

/*
 * The contract declares `witness localSecret(): Bytes<32>` without an
 * implementation; this supplies it. The circuit treats whatever comes back as
 * untrusted — a caller substituting a different implementation still cannot
 * produce a commitment that is in the registered set unless they hold a real
 * secret.
 */
export const witnesses = {
  localSecret: ({
    privateState,
  }: WitnessContext<Ledger, PainPathPrivateState>): [
    PainPathPrivateState,
    Uint8Array,
  ] => [privateState, privateState.secret],
};

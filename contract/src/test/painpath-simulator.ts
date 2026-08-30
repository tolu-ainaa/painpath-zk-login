/*
 * A testbed for exercising the PainPath contract without a node, an indexer or
 * a proof server. Mirrors the simulator pattern from example-bboard.
 */

import {
  type CircuitContext,
  QueryContext,
  sampleContractAddress,
  createConstructorContext,
  CostModel,
} from "@midnight-ntwrk/compact-runtime";
import {
  Contract,
  type Ledger,
  ledger,
} from "../managed/painpath/contract/index.js";
import { type PainPathPrivateState, witnesses } from "../witnesses.js";

export class PainPathSimulator {
  readonly contract: Contract<PainPathPrivateState>;
  circuitContext: CircuitContext<PainPathPrivateState>;

  constructor(secret: Uint8Array) {
    this.contract = new Contract<PainPathPrivateState>(witnesses);
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      createConstructorContext({ secret }, "0".repeat(64)),
    );
    this.circuitContext = {
      currentPrivateState,
      currentZswapLocalState,
      costModel: CostModel.initialCostModel(),
      currentQueryContext: new QueryContext(
        currentContractState.data,
        sampleContractAddress(),
      ),
    };
  }

  /** Swap in a different clinician's secret against the same ledger. */
  public switchUser(secret: Uint8Array): void {
    this.circuitContext.currentPrivateState = { secret };
  }

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public getPrivateState(): PainPathPrivateState {
    return this.circuitContext.currentPrivateState;
  }

  public register(): Ledger {
    this.circuitContext = this.contract.impureCircuits.register(
      this.circuitContext,
    ).context;
    return this.getLedger();
  }

  public authenticate(challenge: Uint8Array): Ledger {
    this.circuitContext = this.contract.impureCircuits.authenticate(
      this.circuitContext,
      challenge,
    ).context;
    return this.getLedger();
  }

  /** Pure helpers, used by tests to assert what the ledger should contain. */
  public commitmentFor(secret: Uint8Array): Uint8Array {
    return this.contract.circuits.credentialCommitment(
      this.circuitContext,
      secret,
    ).result;
  }

  public nullifierFor(challenge: Uint8Array, secret: Uint8Array): Uint8Array {
    return this.contract.circuits.sessionNullifier(
      this.circuitContext,
      challenge,
      secret,
    ).result;
  }

  /** Everything the public ledger holds, as hex. Mirrors the verifier panel. */
  public dumpLedger(): { commitments: string[]; nullifiers: string[] } {
    const l = this.getLedger();
    return {
      commitments: [...l.commitments].map(toHex),
      nullifiers: [...l.nullifiers].map(toHex),
    };
  }
}

export const toHex = (b: Uint8Array): string =>
  [...b].map((x) => x.toString(16).padStart(2, "0")).join("");

/** A deterministic 32-byte value, so tests are reproducible. */
export const bytes32 = (fill: number): Uint8Array =>
  new Uint8Array(32).fill(fill);

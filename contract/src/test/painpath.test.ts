import { describe, it, expect } from "vitest";
import { PainPathSimulator, bytes32, toHex } from "./painpath-simulator.js";

// Two clinicians and two portal-issued login challenges.
const SARAH = bytes32(0x11);
const AMARA = bytes32(0x22);
const IMPOSTOR = bytes32(0x99);

const CHALLENGE_1 = bytes32(0xa1);
const CHALLENGE_2 = bytes32(0xa2);

describe("ledger state", () => {
  it("starts empty", () => {
    const sim = new PainPathSimulator(SARAH);
    const l = sim.getLedger();
    expect(l.commitments.isEmpty()).toBe(true);
    expect(l.nullifiers.isEmpty()).toBe(true);
  });
});

describe("register", () => {
  it("inserts exactly one commitment", () => {
    const sim = new PainPathSimulator(SARAH);
    const l = sim.register();
    expect(l.commitments.size()).toBe(1n);
    expect(l.commitments.member(sim.commitmentFor(SARAH))).toBe(true);
  });

  it("does not put the secret, or anything derived from it but the commitment, on the ledger", () => {
    const sim = new PainPathSimulator(SARAH);
    sim.register();
    const dump = sim.dumpLedger();

    // The one entry is the commitment and nothing else.
    expect(dump.commitments).toEqual([toHex(sim.commitmentFor(SARAH))]);
    expect(dump.nullifiers).toEqual([]);

    // The secret itself appears nowhere.
    expect(dump.commitments).not.toContain(toHex(SARAH));
    expect(toHex(sim.commitmentFor(SARAH))).not.toBe(toHex(SARAH));
  });

  it("rejects registering the same secret twice", () => {
    const sim = new PainPathSimulator(SARAH);
    sim.register();
    expect(() => sim.register()).toThrow(/already registered/);
  });

  it("gives different clinicians different commitments", () => {
    const sim = new PainPathSimulator(SARAH);
    expect(toHex(sim.commitmentFor(SARAH))).not.toBe(
      toHex(sim.commitmentFor(AMARA)),
    );
  });
});

describe("authenticate", () => {
  it("succeeds for a registered secret and spends one nullifier", () => {
    const sim = new PainPathSimulator(SARAH);
    sim.register();

    const l = sim.authenticate(CHALLENGE_1);
    expect(l.nullifiers.size()).toBe(1n);
    expect(l.nullifiers.member(sim.nullifierFor(CHALLENGE_1, SARAH))).toBe(true);
  });

  it("rejects a secret that was never registered", () => {
    const sim = new PainPathSimulator(SARAH);
    sim.register();

    sim.switchUser(IMPOSTOR);
    expect(() => sim.authenticate(CHALLENGE_1)).toThrow(/no credential registered/);
  });

  it("rejects a replayed proof — the same challenge cannot be used twice", () => {
    const sim = new PainPathSimulator(SARAH);
    sim.register();
    sim.authenticate(CHALLENGE_1);

    expect(() => sim.authenticate(CHALLENGE_1)).toThrow(/already been used/);
  });

  it("still allows the same clinician to log in again with a fresh challenge", () => {
    const sim = new PainPathSimulator(SARAH);
    sim.register();
    sim.authenticate(CHALLENGE_1);

    const l = sim.authenticate(CHALLENGE_2);
    expect(l.nullifiers.size()).toBe(2n);
    expect(l.nullifiers.member(sim.nullifierFor(CHALLENGE_2, SARAH))).toBe(true);
  });

  it("gives different clinicians different nullifiers for the same challenge", () => {
    const sim = new PainPathSimulator(SARAH);
    expect(toHex(sim.nullifierFor(CHALLENGE_1, SARAH))).not.toBe(
      toHex(sim.nullifierFor(CHALLENGE_1, AMARA)),
    );
  });

  it("does not let one clinician's login block another's", () => {
    const sim = new PainPathSimulator(SARAH);
    sim.register();
    sim.switchUser(AMARA);
    sim.register();

    sim.switchUser(SARAH);
    sim.authenticate(CHALLENGE_1);

    sim.switchUser(AMARA);
    const l = sim.authenticate(CHALLENGE_1);
    expect(l.nullifiers.size()).toBe(2n);
  });
});

describe("domain separation", () => {
  it("a commitment and a nullifier for the same secret are different values", () => {
    const sim = new PainPathSimulator(SARAH);
    expect(toHex(sim.commitmentFor(SARAH))).not.toBe(
      toHex(sim.nullifierFor(CHALLENGE_1, SARAH)),
    );
  });

  it("a nullifier can never be mistaken for a registered commitment", () => {
    const sim = new PainPathSimulator(SARAH);
    sim.register();
    sim.authenticate(CHALLENGE_1);

    const l = sim.getLedger();
    for (const n of l.nullifiers) {
      expect(l.commitments.member(n)).toBe(false);
    }
  });
});

describe("what a breach would yield", () => {
  it("leaves nothing on the ledger that can be turned back into a login", () => {
    const sim = new PainPathSimulator(SARAH);
    sim.register();
    sim.switchUser(AMARA);
    sim.register();
    sim.switchUser(SARAH);
    sim.authenticate(CHALLENGE_1);

    const dump = sim.dumpLedger();

    // Everything on the ledger is a 32-byte hash.
    for (const entry of [...dump.commitments, ...dump.nullifiers]) {
      expect(entry).toMatch(/^[0-9a-f]{64}$/);
    }

    // No clinician's secret is present anywhere.
    for (const secret of [SARAH, AMARA]) {
      expect(dump.commitments).not.toContain(toHex(secret));
      expect(dump.nullifiers).not.toContain(toHex(secret));
    }
  });
});

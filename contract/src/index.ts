import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";

export * from "./managed/painpath/contract/index.js";
export * from "./witnesses.js";

import * as CompiledPainPathContract from "./managed/painpath/contract/index.js";
import * as Witnesses from "./witnesses.js";

export const PainPathContract = CompiledContract.make<
  CompiledPainPathContract.Contract<Witnesses.PainPathPrivateState>
>(
  "PainPath",
  CompiledPainPathContract.Contract<Witnesses.PainPathPrivateState>,
).pipe(
  CompiledContract.withWitnesses(Witnesses.witnesses),
  CompiledContract.withCompiledFileAssets("./managed/painpath"),
);

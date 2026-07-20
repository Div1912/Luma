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
} from "../managed/ghost/contract/index.js";

export class GhostSimulator {
  readonly contract: Contract<void>;
  circuitContext: CircuitContext<void>;

  constructor(limit: bigint) {
    this.contract = new Contract<void>({});
    const {
      currentPrivateState,
      currentContractState,
      currentZswapLocalState,
    } = this.contract.initialState(
      createConstructorContext({}, "0".repeat(64)),
      limit,
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

  public getLedger(): Ledger {
    return ledger(this.circuitContext.currentQueryContext.state);
  }

  public spend(amount: bigint): Ledger {
    this.circuitContext = this.contract.impureCircuits.spend(
      this.circuitContext,
      amount,
    ).context;
    return ledger(this.circuitContext.currentQueryContext.state);
  }
}

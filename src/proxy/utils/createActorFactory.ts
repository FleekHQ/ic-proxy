import { HttpAgent, ActorFactory } from "@dfinity/agent";

export default (agent: HttpAgent): ActorFactory =>
  agent.makeActorFactory(({ IDL: e }) => {
    const t = e.Text,
      r = e.Vec(e.Nat8);
    return e.Service({
      retrieve: e.Func([t], [r], ["query"]),
      list: e.Func([], [e.Vec(t)], ["query"]),
      store: e.Func([t, r], [], []),
    });
  });

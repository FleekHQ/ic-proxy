import * as ic from "@dfinity/agent";
// import nacl from "tweetnacl";

// const keyPair = nacl.sign.keyPair();

global.fetch = require("node-fetch");
global.crypto = require("crypto").webcrypto;

// class UserIdentity extends ic.SignIdentity {
//   private keyPair: nacl.SignKeyPair;

//   constructor(keyPair: nacl.SignKeyPair) {
//     super();
//     this.keyPair = keyPair;
//   }

//   getPublicKey(): ic.PublicKey {
//     return {
//       toDer: () =>
//         ic.derBlobFromBlob(ic.blobFromUint8Array(this.keyPair.publicKey)),
//     };
//   }

//   async sign(blob: ic.BinaryBlob): Promise<ic.BinaryBlob> {
//     return ic.blobFromUint8Array(
//       nacl.sign.detached(blob, this.keyPair.secretKey)
//     );
//   }
// }

export default (): ic.HttpAgent => {
  // const identity = new UserIdentity(keyPair);

  if ((global as any).ic && (global as any).ic.agent) {
    return (global as any).ic.agent;
  }

  // const identity = new ic.AnonymousIdentity();

  const agent = new ic.HttpAgent({
    // identity,
    host: "https://mercury.dfinity.network",
  });

  // agent.addTransform(ic.makeNonceTransform());

  (global as any).ic = {
    ...ic,
    agent,
  };

  return agent;
};

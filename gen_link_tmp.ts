import { generateKey, generateNonce } from "near-kit";
const message = "I verify I have diaper hands and own this NEAR account.";
const recipient = "huggies.near";
async function acc(id: string) {
  const kp = await generateKey();
  const nonce = generateNonce();
  const s = kp.signNep413Message(id, { message, nonce, recipient });
  return { accountId: s.accountId, publicKey: s.publicKey, signature: s.signature, message,
           nonce: Buffer.from(nonce).toString("base64"), recipient };
}
const alice = await acc("alice.near");
const bob = await acc("bob.near");
console.log(JSON.stringify({ alice, bob }));

import assert from 'node:assert/strict';
import { createHash, createPublicKey, verify } from 'node:crypto';

// Tauri wraps minisign text in base64. Verify the actual installer bytes, not
// just presence of a .sig file. Node's crypto supports Ed25519 + BLAKE2b-512.
export function verifyUpdaterSignature(bytes, signature, publicKey) {
  const keyLines = Buffer.from(publicKey.trim(), 'base64').toString('utf8').trim().split(/\r?\n/);
  const sigLines = Buffer.from(signature.trim(), 'base64').toString('utf8').trim().split(/\r?\n/);
  const keyPacket = Buffer.from(keyLines[1] ?? '', 'base64');
  const sigPacket = Buffer.from(sigLines[1] ?? '', 'base64');
  assert.equal(keyPacket.length, 42, 'Invalid public key packet');
  assert.equal(sigPacket.length, 74, 'Invalid signature packet');
  assert.equal(keyPacket.subarray(0, 2).toString(), 'Ed');
  assert.ok(keyPacket.subarray(2, 10).equals(sigPacket.subarray(2, 10)), 'Signature key ID differs from configured updater key');
  const algorithm = sigPacket.subarray(0, 2).toString();
  assert.ok(algorithm === 'Ed' || algorithm === 'ED', 'Unsupported minisign algorithm');
  const key = createPublicKey({
    key: Buffer.concat([Buffer.from('302a300506032b6570032100', 'hex'), keyPacket.subarray(10)]),
    format: 'der',
    type: 'spki'
  });
  const message = algorithm === 'ED' ? createHash('blake2b512').update(bytes).digest() : bytes;
  assert.ok(verify(null, message, key, sigPacket.subarray(10)), 'Installer updater signature is invalid');
  assert.ok(sigLines[2]?.startsWith('trusted comment: '), 'Missing trusted comment');
  const globalMessage = Buffer.concat([sigPacket.subarray(10), Buffer.from(sigLines[2].slice('trusted comment: '.length))]);
  assert.ok(verify(null, globalMessage, key, Buffer.from(sigLines[3] ?? '', 'base64')), 'Minisign trusted comment signature is invalid');
}

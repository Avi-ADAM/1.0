# consent-v1 test vectors

The cross-language contract for 1lev1's signed consent layer: canonical
JSON, signed objects (Ed25519 / ECDSA-P256), the event projection and its
state root, and group encryption. An implementation is conformant when it
reproduces every file here byte for byte.

- Normative description: [`docs/SPEC_CONSENT_FORMAT.md`](../../docs/SPEC_CONSENT_FORMAT.md)
- Reference implementation: `src/lib/crypto/`, `src/lib/consent/`, `src/lib/space/` (TypeScript)
- Generator: `src/lib/consent/vectors/build.ts` — `npm run vectors:consent`
- Checked on every `npm test` by `src/lib/consent/vectors/vectors.test.ts`

| file | contents |
|---|---|
| `canonical.json` | JSON text → canonical string + SHA-256, and inputs that must be rejected |
| `signatures.json` | RFC 8032 anchor, keys, valid objects (event, DeviceCert, P-256), invalid objects with the expected reason |
| `events.json` | signed event logs → topological order, dedupe, heads, root after each step, normalized state, final root |
| `e2e.json` | epoch-key commitment, sealed envelope (AES-256-GCM), KEM wrap (ECDH P-256 + HKDF) with intermediates |

All keys, nonces and IVs derive from `SHA-256("1lev1-consent-v1/" + label)`,
so every file is reproducible except the one ECDSA signature (randomized by
WebCrypto, frozen, verify-only).

**Regenerating is a contract change.** If an id or a state root moves for an
existing input, every signature and commitment already in the wild breaks —
bump a version (`STATE_ROOT_VERSION`, the event `v`) instead.

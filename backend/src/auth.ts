import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const secret = process.env.JWT_SECRET ?? "avaliatech-local-development-secret";

type TokenPayload = {
  userId: string;
  companyId: string;
  role: string;
  exp: number;
};

function base64Url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function sign(content: string) {
  return createHmac("sha256", secret).update(content).digest("base64url");
}

export function createId(prefix: string) {
  return `${prefix}-${randomBytes(8).toString("hex")}`;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  if (!storedHash.startsWith("scrypt$")) {
    return password === storedHash;
  }

  const [, salt, hash] = storedHash.split("$");
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function createToken(payload: Omit<TokenPayload, "exp">, expiresInSeconds = 60 * 60 * 8) {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64Url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + expiresInSeconds }));
  const unsigned = `${header}.${body}`;
  return `${unsigned}.${sign(unsigned)}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const [header, body, signature] = token.split(".");
  if (!header || !body || !signature) return null;

  const unsigned = `${header}.${body}`;
  const expected = sign(unsigned);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== signatureBuffer.length || !timingSafeEqual(expectedBuffer, signatureBuffer)) {
    return null;
  }

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as TokenPayload;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

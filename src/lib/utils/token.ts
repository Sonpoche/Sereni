// src/lib/utils/token.ts
import { randomBytes } from 'crypto'

export async function createToken(userId: string, expiry: string) {
  const token = randomBytes(32).toString('hex')
  return token
}
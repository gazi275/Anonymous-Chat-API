import { randomBytes } from 'crypto';

export const createPrefixedId = (prefix: string): string => `${prefix}_${randomBytes(3).toString('hex')}`;

export const createOpaqueToken = (): string => `tok_${randomBytes(32).toString('hex')}`;
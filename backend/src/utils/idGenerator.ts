import { randomBytes } from 'crypto';

export function generateRandomId(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    result += chars[randomIndex];
  }
  
  return result;
}

export function generateEventId(): string {
  return generateRandomId(12);
}

export function generateSurveyId(): string {
  return generateRandomId(12);
}

export function generateUserToken(): string {
  return randomBytes(16).toString('hex');
}
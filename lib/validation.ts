import { z } from 'zod';

/**
 * Validierungsschemas für Benutzereingaben
 */

// Registrierung-Schema
export const registerSchema = z.object({
  username: z
    .string()
    .min(3, 'Benutzername muss mindestens 3 Zeichen lang sein')
    .max(50, 'Benutzername darf maximal 50 Zeichen lang sein')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Benutzername darf nur Buchstaben, Zahlen, Unterstriche und Bindestriche enthalten'),
  password: z
    .string()
    .min(8, 'Passwort muss mindestens 8 Zeichen lang sein')
    .max(128, 'Passwort darf maximal 128 Zeichen lang sein')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Passwort muss mindestens einen Kleinbuchstaben, einen Großbuchstaben und eine Zahl enthalten'),
  email: z
    .string()
    .email('Ungültige E-Mail-Adresse')
    .optional()
    .or(z.literal('')),
  confirmPassword: z
    .string()
    .optional()
}).refine((data) => {
  if (data.confirmPassword && data.password !== data.confirmPassword) {
    return false;
  }
  return true;
}, {
  message: 'Passwörter stimmen nicht überein',
  path: ['confirmPassword']
}).transform((data) => {
  return {
    ...data,
    email: data.email === '' ? undefined : data.email
  };
});

// Anmeldung-Schema
export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Benutzername ist erforderlich'),
  password: z
    .string()
    .min(1, 'Passwort ist erforderlich')
});

// Typen für TypeScript
export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Validierungsfunktionen
 */

export function validateRegister(data: unknown): { success: true; data: RegisterInput } | { success: false; errors: string[] } {
  try {
    const validatedData = registerSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => err.message);
      return { success: false, errors };
    }
    return { success: false, errors: ['Ungültige Eingabedaten'] };
  }
}

export function validateLogin(data: unknown): { success: true; data: LoginInput } | { success: false; errors: string[] } {
  try {
    const validatedData = loginSchema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => err.message);
      return { success: false, errors };
    }
    return { success: false, errors: ['Ungültige Eingabedaten'] };
  }
}

/**
 * Hilfsfunktionen für Validierung
 */

export function sanitizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export function isStrongPassword(password: string): boolean {
  // Mindestens 8 Zeichen, Groß- und Kleinbuchstaben, Zahlen
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
}

export function getPasswordStrength(password: string): 'weak' | 'medium' | 'strong' {
  if (password.length < 8) return 'weak';
  
  let score = 0;
  if (/[a-z]/.test(password)) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[@$!%*?&]/.test(password)) score++;
  if (password.length >= 12) score++;
  
  if (score >= 4) return 'strong';
  if (score >= 2) return 'medium';
  return 'weak';
} 
import {
  isPossiblePhoneNumber,
  parsePhoneNumber,
  validatePhoneNumberLength,
} from 'libphonenumber-js'
import normalizeURL from 'normalize-url'
import { z } from 'zod'

export const UsernameSchema = z
  .string({ required_error: 'Username is required' })
  .min(3, { message: 'Username is too short' })
  .max(20, { message: 'Username is too long' })
  .regex(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only include letters, numbers, and underscores',
  })
  // users can type the username in any case, but we store it in lowercase
  .transform(value => value.toLowerCase())

export const PasswordSchema = z
  .string({ required_error: 'Password is required' })
  .min(6, { message: 'Password is too short' })
  .max(100, { message: 'Password is too long' })

export const LinkedInSchema = z
  .string({ required_error: 'LinkedIn URL is required' })
  .url({ message: 'LinkedIn URL is invalid' })
  .includes('linkedin.com/in/', {
    message: 'URL should include https://linkedin.com/in/',
  })
  .transform(value => normalizeURL(value, { defaultProtocol: 'https' }))

export const NameSchema = z
  .string({ required_error: 'Name is required' })
  .max(40, { message: 'Name is too long' })

export const PhoneSchema = z
  .string({ required_error: 'Phone is required' })
  .superRefine((value, ctx) => {
    try {
      const parsed = parsePhoneNumber(value, 'US').formatInternational()
      const valid = isPossiblePhoneNumber(parsed)
      if (!valid) {
        const error = validatePhoneNumberLength(parsed)
        ctx.addIssue({
          code: 'custom',
          message: `Phone is invalid: ${error}`,
        })
      }
    } catch (err) {
      ctx.addIssue({
        code: 'custom',
        message: `Phone is invalid: ${(err as Error).message}`,
      })
    }
  })
  .transform(value => parsePhoneNumber(value, 'US').formatInternational())

export const EmailSchema = z
  .string({ required_error: 'Email is required' })
  .email({ message: 'Email is invalid' })
  .min(3, { message: 'Email is too short' })
  .max(100, { message: 'Email is too long' })
  // users can type the email in any case, but we store it in lowercase
  .transform(value => value.toLowerCase())

export const ConfirmPasswordSchema = z
  .object({ password: PasswordSchema, confirmPassword: PasswordSchema })
  .superRefine(({ confirmPassword, password }, ctx) => {
    if (confirmPassword !== password) {
      ctx.addIssue({
        path: ['confirmPassword'],
        code: 'custom',
        message: 'The passwords must match',
      })
    }
  })

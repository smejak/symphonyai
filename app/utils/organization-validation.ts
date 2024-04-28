import normalizeURL from 'normalize-url'
import { z } from 'zod'

export const CompanyNameSchema = z
  .string({ required_error: 'Name is required' })
  .max(40, { message: 'Name is too long' })

export const DomainSchema = z
  .string({ required_error: 'Domain is required' })
  .includes('.', { message: 'Domain is invalid' })
  .min(4, { message: 'Domain is too short' })

export const WebsiteSchema = z
  .string({ required_error: 'Website is required' })
  .url({ message: 'Website is invalid' })
  .transform(value => normalizeURL(value, { defaultProtocol: 'https' }))

export const LinkedInSchema = z
  .string({ required_error: 'LinkedIn URL is required' })
  .url({ message: 'LinkedIn URL is invalid' })
  .includes('linkedin.com/', {
    message: 'URL should include https://linkedin.com/',
  })
  .transform(value => normalizeURL(value, { defaultProtocol: 'https' }))

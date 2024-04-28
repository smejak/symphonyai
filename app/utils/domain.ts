// https://email-verify.my-addr.com/list-of-most-popular-email-domains.php
import normalizeURL from '#node_modules/normalize-url'
import _ from 'lodash'

const EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'aol.com',
  'hotmail.co',
  'hotmail.co.uk',
  'hotmail.fr',
  'msn.com',
  'yahoo.fr',
  'wanadoo.fr',
  'orange.fr',
  'comcast.net',
  'yahoo.co.uk',
  'yahoo.com.br',
  'yahoo.co.in',
] as const

export function getDomainElements(email: string) {
  const domain = getDomain(email)
  return {
    domain: EMAIL_DOMAINS.includes(domain) ? undefined : domain,
    website: EMAIL_DOMAINS.includes(domain)
      ? undefined
      : normalizeURL(email, { defaultProtocol: 'https' }),
    company: EMAIL_DOMAINS.includes(domain)
      ? undefined
      : _.startCase(domain.split('.')[0]),
  }
}

export function getDomain(url: string) {
  return normalizeURL(url, { stripProtocol: true })
}

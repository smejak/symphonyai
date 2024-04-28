import { createId as cuid } from '@paralleldrive/cuid2'
import { redirect } from '@remix-run/node'
import { OIDCStrategy } from 'web-oidc/remix'

import { connectionSessionStorage } from '#app/utils/connections.server.ts'
import { getDomainElements } from '#app/utils/domain.ts'
import { type AuthProvider } from '#app/utils/providers/provider.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'

const shouldMock = process.env.GOOGLE_CLIENT_ID?.startsWith('MOCK_')

export class GoogleProvider implements AuthProvider {
  getAuthStrategy() {
    return new OIDCStrategy(
      {
        client_id: process.env.GOOGLE_CLIENT_ID as string,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.ROOT_URL}/auth/google/callback`,
        authorizationParams: {
          scope: ['openid', 'email', 'profile'],
        },
        issuer: 'https://accounts.google.com',
        response_type: 'code',
      },
      async ({ profile }) => {
        if (!profile.email || !profile.email_verified) {
          throw redirectWithToast('/login', {
            title: 'Cannot connect Google Account',
            description: 'Your Google Email is Unverified',
            type: 'error',
          })
        }
        const domain = getDomainElements(profile.email)
        return {
          id: profile.sub,
          email: profile.email,
          username: profile.preferred_username,
          name: profile.name,
          firstName: profile.given_name,
          lastName: profile.family_name,
          imageUrl: profile.picture,
          ...domain,
        }
      },
    )
  }

  async resolveConnectionData(providerId: string) {
    // You may consider making a fetch request to Google to get the user's
    // profile or something similar here.
    return { displayName: providerId, link: null } as const
  }

  // This is used to mock the Google OAuth flow in development.
  async handleMockAction(request: Request) {
    if (!shouldMock) return

    const connectionSession = await connectionSessionStorage.getSession(
      request.headers.get('cookie'),
    )
    const state = cuid()
    connectionSession.set('oidc:state', state)
    const code = 'MOCK_CODE_GOOGLE_KODY'
    const searchParams = new URLSearchParams({ code, state })
    throw redirect(`/auth/google/callback?${searchParams}`, {
      headers: {
        'set-cookie':
          await connectionSessionStorage.commitSession(connectionSession),
      },
    })
  }
}

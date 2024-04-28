import { parseWithZod } from '@conform-to/zod'
import { invariantResponse } from '@epic-web/invariant'
import {
  type ActionFunctionArgs,
  type HeadersFunction,
  type LinksFunction,
  type LoaderFunctionArgs,
  type MetaFunction,
  json,
} from '@remix-run/node'
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useFetchers,
  useLoaderData,
} from '@remix-run/react'
import { withSentry } from '@sentry/remix'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import { z } from 'zod'

import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { EpicProgress } from '#app/components/progress-bar.tsx'
import { useToast } from '#app/components/toaster.tsx'
import { href as iconsHref } from '#app/components/ui/icon.tsx'
import { EpicToaster } from '#app/components/ui/sonner.tsx'

import { getUserId, logout } from '#app/utils/auth.server.ts'
import {
  ClientHintCheck,
  getHints,
  useHints,
} from '#app/utils/client-hints.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { getEnv } from '#app/utils/env.server.ts'
import { honeypot } from '#app/utils/honeypot.server.ts'
import { combineHeaders, getDomainUrl } from '#app/utils/misc.tsx'
import { useNonce } from '#app/utils/nonce-provider.ts'
import { useRequestInfo } from '#app/utils/request-info.ts'
import { type Theme, getTheme, setTheme } from '#app/utils/theme.server.ts'
import { makeTimings, time } from '#app/utils/timing.server.ts'
import { getToast } from '#app/utils/toast.server.ts'

import tailwindStyleSheetUrl from './styles/tailwind.css?url'

export const links: LinksFunction = () => {
  return [
    // Preload svg sprite as a resource to avoid render blocking
    { rel: 'preload', href: iconsHref, as: 'image' },
    // Preload CSS as a resource to avoid render blocking
    { rel: 'mask-icon', href: '/favicons/mask-icon.svg' },
    {
      rel: 'alternate icon',
      type: 'image/png',
      href: '/favicons/favicon-32x32.png',
    },
    { rel: 'apple-touch-icon', href: '/favicons/apple-touch-icon.png' },
    {
      rel: 'manifest',
      href: '/site.webmanifest',
      crossOrigin: 'use-credentials',
    } as const, // necessary to make typescript happy
    //These should match the css preloads above to avoid css as render blocking resource
    { rel: 'icon', type: 'image/svg+xml', href: '/favicons/favicon.svg' },
    { rel: 'stylesheet', href: tailwindStyleSheetUrl },
  ].filter(Boolean)
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [
    { title: data ? 'Reagent' : 'Error | Reagent' },
    { name: 'description', content: '' },
  ]
}

export async function loader({ request }: LoaderFunctionArgs) {
  const timings = makeTimings('root loader')
  const userId = await time(() => getUserId(request), {
    timings,
    type: 'getUserId',
    desc: 'getUserId in root',
  })

  const user = userId
    ? await time(
        () =>
          prisma.user.findUniqueOrThrow({
            select: {
              id: true,
              name: true,
              email: true,
              image: { select: { id: true } },
              roles: {
                select: {
                  name: true,
                  permissions: {
                    select: { entity: true, action: true, access: true },
                  },
                },
              },
            },
            where: { id: userId },
          }),
        { timings, type: 'find user', desc: 'find user in root' },
      )
    : null
  if (userId && !user) {
    console.info('something weird happened')
    // something weird happened... The user is authenticated but we can't find
    // them in the database. Maybe they were deleted? Let's log them out.
    await logout({ request, redirectTo: '/' })
  }
  const { toast, headers: toastHeaders } = await getToast(request)
  return json(
    {
      user,
      ENV: getEnv(),
      requestInfo: {
        hints: getHints(request),
        origin: getDomainUrl(request),
        path: new URL(request.url).pathname,
        userPrefs: {
          theme: getTheme(request),
        },
      },
      toast,
      honeyProps: honeypot.getInputProps(),
    },
    {
      headers: combineHeaders(
        { 'Server-Timing': timings.toString() },
        toastHeaders,
      ),
    },
  )
}

export const headers: HeadersFunction = ({ loaderHeaders }) => {
  const headers = {
    'Server-Timing': loaderHeaders.get('Server-Timing') ?? '',
  }
  return headers
}

const ThemeFormSchema = z.object({
  theme: z.enum(['system', 'light', 'dark']),
})

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData()
  const submission = parseWithZod(formData, {
    schema: ThemeFormSchema,
  })

  invariantResponse(submission.status === 'success', 'Invalid theme received')

  const { theme } = submission.value

  const responseInit = {
    headers: { 'set-cookie': setTheme(theme) },
  }
  return json({ result: submission.reply() }, responseInit)
}

function Document({
  children,
  nonce,
  theme = 'light',
  env = {},
}: {
  children: React.ReactNode
  nonce: string
  theme?: Theme
  env?: Record<string, string>
}) {
  return (
    <html lang="en" className={`${theme} h-full overflow-x-hidden`}>
      <head>
        <ClientHintCheck nonce={nonce} />
        <Meta />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Links />
      </head>
      <body className="bg-background text-foreground">
        {children}
        <script
          nonce={nonce}
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env)}`,
          }}
        />
        <ScrollRestoration nonce={nonce} />
        <Scripts nonce={nonce} />
      </body>
    </html>
  )
}

function App() {
  const data = useLoaderData<typeof loader>()
  const nonce = useNonce()
  const theme = useTheme()
  useToast(data.toast)

  return (
    <Document nonce={nonce} theme="light" env={data.ENV}>
      <div className="tracking-normal text-zinc-900 antialiased">
        <Outlet />
      </div>
      <EpicToaster closeButton position="top-center" theme={theme} />
      <EpicProgress />
    </Document>
  )
}

function AppWithProviders() {
  const data = useLoaderData<typeof loader>()
  return (
    <HoneypotProvider {...data.honeyProps}>
      <App />
    </HoneypotProvider>
  )
}

export default withSentry(AppWithProviders)

/**
 * @returns the user's theme preference, or the client hint theme if the user
 * has not set a preference.
 */
export function useTheme() {
  const hints = useHints()
  const requestInfo = useRequestInfo()
  const optimisticMode = useOptimisticThemeMode()
  if (optimisticMode) {
    return optimisticMode === 'system' ? hints.theme : optimisticMode
  }
  return requestInfo.userPrefs.theme ?? hints.theme
}

/**
 * If the user's changing their theme mode preference, this will return the
 * value it's being changed to.
 */
export function useOptimisticThemeMode() {
  const fetchers = useFetchers()
  const themeFetcher = fetchers.find(f => f.formAction === '/')

  if (themeFetcher && themeFetcher.formData) {
    const submission = parseWithZod(themeFetcher.formData, {
      schema: ThemeFormSchema,
    })

    if (submission.status === 'success') {
      return submission.value.theme
    }
  }
}

export function ErrorBoundary() {
  // the nonce doesn't rely on the loader so we can access that
  const nonce = useNonce()

  // NOTE: you cannot use useLoaderData in an ErrorBoundary because the loader
  // likely failed to run so we have to do the best we can.
  // We could probably do better than this (it's possible the loader did run).
  // This would require a change in Remix.

  // Just make sure your root route never errors out and you'll always be able
  // to give the user a better UX.

  return (
    <Document nonce={nonce}>
      <GeneralErrorBoundary />
    </Document>
  )
}

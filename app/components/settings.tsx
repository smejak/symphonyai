import { Link } from '@remix-run/react'

import { cn } from '#app/utils/misc.tsx'

interface SectionProps {
  title: string
  description: string
  elements: React.ReactNode[]
  elementClassName?: string
}

export function Section(props: SectionProps) {
  return (
    <div className="grid max-w-7xl grid-cols-1 gap-x-8 lg:gap-x-20 gap-y-4 lg:grid-cols-3 xl:grid-cols-4">
      <div className="space-y-0">
        <h2 className="text-sm font-bold tracking-normal uppercase leading-7 text-slate-900">
          {props.title}
        </h2>
        <p className="text-sm leading-6 text-slate-500">{props.description}</p>
      </div>
      <dl className="lg:col-span-2 xl:col-span-3 divide-y divide-slate-100 text-sm leading-6">
        {props.elements.map((ele, i) => (
          <div className={cn('py-3 sm:flex', props.elementClassName)} key={i}>
            {ele}
          </div>
        ))}
      </dl>
    </div>
  )
}

interface EntryProps {
  title: React.ReactNode
  value?: React.ReactNode | null
  action?: Partial<{
    href: string
    text: string
    className: string
  }>
}

export function Setting({ title, value, action }: EntryProps) {
  const button = action && (
    <button
      type="button"
      className={cn(
        'font-semibold text-indigo-600 hover:text-indigo-500',
        action?.className,
      )}
    >
      {action.text || 'Edit'}
    </button>
  )
  return (
    <>
      <dt className="font-medium text-gray-900 sm:w-48 sm:flex-none sm:pr-6">
        {title}
      </dt>
      <dd className="mt-1 flex justify-between gap-x-6 sm:mt-0 sm:flex-auto">
        <div
          className={cn(
            'text-gray-900',
            value === null && 'text-muted-foreground italic',
          )}
        >
          {value === null ? 'None' : value}
        </div>
        {action?.href ? <Link to={action.href}>{button}</Link> : button}
      </dd>
    </>
  )
}

import * as React from 'react'

import { cn } from '#app/utils/misc.tsx'

type Props = { size?: 'sm' | 'md' } & React.HTMLAttributes<HTMLDivElement>

export function Loader({ className, size = 'md' }: Props) {
  const classes = size === 'md' ? 'h-3 w-3' : 'h-2 w-2'
  return (
    <div className={cn('flex justify-center', className)}>
      <span
        className={cn(
          'duration-450 mx-1 my-12 animate-bounce rounded-full bg-gray-800 ease-in-out',
          classes,
        )}
      />
      <span
        className={cn(
          'duration-450 mx-1 my-12 animate-bounce rounded-full bg-gray-800 delay-150 ease-in-out',
          classes,
        )}
      />
      <span
        className={cn(
          'duration-450 mx-1 my-12 animate-bounce rounded-full bg-gray-800 delay-300 ease-in-out',
          classes,
        )}
      />
    </div>
  )
}

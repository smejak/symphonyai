import { E164Number } from 'libphonenumber-js'
import React from 'react'
import RPhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'

import { InputClasses, InputProps } from '#app/components/ui/input.tsx'

import { cn } from '#app/utils/misc.tsx'

const PhoneInput = React.forwardRef<
  HTMLInputElement,
  InputProps & {
    value: E164Number | undefined
    onChange: (value?: E164Number) => void
  }
>(({ className, type, ...props }, ref) => {
  return (
    <RPhoneInput
      className={cn(InputClasses, 'focus:outline-none shadow-none', className)}
      {...props}
    />
  )
})
PhoneInput.displayName = 'PhoneInput'

export { PhoneInput }

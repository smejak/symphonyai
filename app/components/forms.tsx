import { useInputControl } from '@conform-to/react'
import { E164Number } from 'libphonenumber-js'
import React, { useId } from 'react'

import { Checkbox, type CheckboxProps } from '#app/components/ui/checkbox.tsx'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '#app/components/ui/input-otp.tsx'
import { PhoneInput } from '#app/components/ui/input-phone.tsx'
import { Input } from '#app/components/ui/input.tsx'
import { Label } from '#app/components/ui/label.tsx'
import { Textarea } from '#app/components/ui/textarea.tsx'

import { cn } from '#app/utils/misc.tsx'

export type ListOfErrors = Array<string | null | undefined> | null | undefined

export function ErrorList({
  id,
  errors,
}: {
  errors?: ListOfErrors
  id?: string
}) {
  const errorsToRender = errors?.filter(Boolean)
  if (!errorsToRender?.length) return null
  return (
    <ul id={id} className="flex flex-col gap-1">
      {errorsToRender.map(e => (
        <li key={e} className="text-xs text-foreground-destructive">
          {e}
        </li>
      ))}
    </ul>
  )
}

export function Field({
  labelProps,
  inputProps,
  errors,
  className,
}: {
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement> & {
    required?: boolean
  }
  inputProps: React.InputHTMLAttributes<HTMLInputElement>
  errors?: ListOfErrors
  className?: string
}) {
  const fallbackId = useId()
  const id = inputProps.id ?? fallbackId
  const errorId = errors?.length ? `${id}-error` : undefined
  return (
    <div className={cn('grid gap-y-2 mb-4', className)}>
      <Label htmlFor={id} {...labelProps} />
      <Input
        id={id}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        {...inputProps}
      />
      {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
    </div>
  )
}

export function TextareaField({
  labelProps,
  textareaProps,
  errors,
  className,
}: {
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
  textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>
  errors?: ListOfErrors
  className?: string
}) {
  const fallbackId = useId()
  const id = textareaProps.id ?? textareaProps.name ?? fallbackId
  const errorId = errors?.length ? `${id}-error` : undefined
  return (
    <div className={cn('grid gap-y-2 mb-4', className)}>
      <Label htmlFor={id} {...labelProps} />
      <Textarea
        id={id}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        {...textareaProps}
      />
      {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
    </div>
  )
}

export function OTPField({
  otpProps,
  errors,
  className,
}: {
  otpProps: React.InputHTMLAttributes<HTMLInputElement>
  errors?: ListOfErrors
  className?: string
}) {
  const fallbackId = useId()
  const id = otpProps.id ?? otpProps.name ?? fallbackId
  const errorId = errors?.length ? `${id}-error` : undefined
  return (
    <div className={cn('grid gap-y-2 mb-4', className)}>
      <InputOTP
        id={id}
        maxLength={6}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        {...(otpProps as any)}
      >
        <InputOTPGroup>
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
    </div>
  )
}

export function PhoneField({
  labelProps,
  inputProps,
  errors,
  className,
}: {
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
  inputProps: React.InputHTMLAttributes<HTMLInputElement> & {
    name: string
    form: string
    value?: E164Number
  }
  errors?: ListOfErrors
  className?: string
}) {
  const { value, ...checkboxProps } = inputProps
  const fallbackId = useId()
  const id = inputProps.id ?? fallbackId
  const errorId = errors?.length ? `${id}-error` : undefined
  const input = useInputControl({
    key: id,
    name: inputProps.name,
    formId: inputProps.form,
    initialValue: value,
  })

  return (
    <div className={cn('grid gap-y-2 mb-4', className)}>
      <Label htmlFor={id} {...labelProps} />
      <PhoneInput
        id={id}
        aria-invalid={errorId ? true : undefined}
        aria-describedby={errorId}
        value={inputProps.value}
        onChange={value => {
          input.change(value?.toString() ?? '')
        }}
        onFocus={event => {
          input.focus()
          inputProps.onFocus?.(event)
        }}
        onBlur={event => {
          input.blur()
          inputProps.onBlur?.(event)
        }}
      />
      {errorId ? <ErrorList id={errorId} errors={errors} /> : null}
    </div>
  )
}

export function CheckboxField({
  labelProps,
  buttonProps,
  errors,
  className,
}: {
  labelProps: JSX.IntrinsicElements['label']
  buttonProps: CheckboxProps & {
    name: string
    form: string
    value?: string
  }
  errors?: ListOfErrors
  className?: string
}) {
  const { key, defaultChecked, ...checkboxProps } = buttonProps
  const fallbackId = useId()
  const checkedValue = buttonProps.value ?? 'on'
  const input = useInputControl({
    key,
    name: buttonProps.name,
    formId: buttonProps.form,
    initialValue: defaultChecked ? checkedValue : undefined,
  })
  const id = buttonProps.id ?? fallbackId
  const errorId = errors?.length ? `${id}-error` : undefined

  return (
    <div className={cn('mb-4', className)}>
      <div className="flex items-start gap-2">
        <Checkbox
          {...checkboxProps}
          className={cn('mt-0.5', checkboxProps.className)}
          id={id}
          aria-invalid={errorId ? true : undefined}
          aria-describedby={errorId}
          checked={input.value === checkedValue}
          onCheckedChange={state => {
            input.change(state.valueOf() ? checkedValue : '')
            buttonProps.onCheckedChange?.(state)
          }}
          onFocus={event => {
            input.focus()
            buttonProps.onFocus?.(event)
          }}
          onBlur={event => {
            input.blur()
            buttonProps.onBlur?.(event)
          }}
          type="button"
        />
        <label
          htmlFor={id}
          {...labelProps}
          className="self-center text-body-xs text-muted-foreground"
        />
      </div>
      {errorId ? (
        <div className="pb-2 pt-1">
          <ErrorList id={errorId} errors={errors} />
        </div>
      ) : null}
    </div>
  )
}

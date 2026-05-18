'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

export function Select({
  value,
  onValueChange,
  children,
}: {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
}) {
  return (
    <SelectContext.Provider value={{ value, onValueChange }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({
  className,
  children,
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('relative', className)}>
      {children}
    </div>
  )
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const context = React.useContext(SelectContext)
  return <span>{context?.value || placeholder}</span>
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  const context = React.useContext(SelectContext)
  const options = React.Children.toArray(children).filter(React.isValidElement) as React.ReactElement<{ value: string; children: React.ReactNode }>[]

  return (
    <select
      value={context?.value}
      onChange={(event) => context?.onValueChange(event.target.value)}
      className="absolute inset-0 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground opacity-100"
    >
      {options.map((option) => (
        <option key={option.props.value} value={option.props.value}>
          {option.props.children}
        </option>
      ))}
    </select>
  )
}

export function SelectItem({
  value,
  children,
}: {
  value: string
  children: React.ReactNode
}) {
  return <option value={value}>{children}</option>
}

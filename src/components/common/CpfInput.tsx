'use client'

import { useState, useEffect } from 'react'
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react'
import { validarCPF, formatarCPF } from '@/lib/cpf'
import { cn } from '@/lib/utils'

interface CpfInputProps {
  name?: string
  required?: boolean
  placeholder?: string
  className?: string
  defaultValue?: string
  onChange?: (valid: boolean, value: string) => void
}

export default function CpfInput({
  name = 'cpf',
  required = false,
  placeholder = '000.000.000-00',
  className = '',
  defaultValue = '',
  onChange,
}: CpfInputProps) {
  const [value, setValue] = useState(defaultValue ? formatarCPF(defaultValue) : '')
  const [touched, setTouched] = useState(false)
  const [isValid, setIsValid] = useState<boolean | null>(null)

  useEffect(() => {
    if (!touched) return
    const nums = value.replace(/\D/g, '')
    if (nums.length === 0) { setIsValid(null); return }
    if (nums.length < 11) { setIsValid(false); return }
    const valid = validarCPF(nums)
    setIsValid(valid)
    onChange?.(valid, nums)
  }, [value, touched])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatarCPF(e.target.value)
    setValue(formatted)
  }

  const icon = isValid === null
    ? null
    : isValid
    ? <CheckCircle2 className="w-4 h-4 text-green-500" />
    : <XCircle className="w-4 h-4 text-red-500" />

  const borderColor = isValid === null
    ? 'border-gray-200 focus:ring-indigo-500'
    : isValid
    ? 'border-green-400 focus:ring-green-500'
    : 'border-red-400 focus:ring-red-500'

  return (
    <div className="relative">
      <input
        type="text"
        name={name}
        value={value}
        required={required}
        placeholder={placeholder}
        maxLength={14}
        inputMode="numeric"
        onChange={handleChange}
        onBlur={() => setTouched(true)}
        className={cn(
          'w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors pr-10',
          borderColor,
          className
        )}
      />
      {touched && icon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {icon}
        </div>
      )}
      {touched && isValid === false && value.replace(/\D/g, '').length === 11 && (
        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
          <XCircle className="w-3 h-3" /> CPF inválido. Verifique o número.
        </p>
      )}
      {touched && isValid === true && (
        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> CPF válido
        </p>
      )}
    </div>
  )
}

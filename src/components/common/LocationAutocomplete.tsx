'use client'

import { useState, useEffect, useRef, KeyboardEvent } from 'react'
import { MapPin, X, Loader2, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Suggestion {
  city: string
  state: string
  label: string
}

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string, city?: string, state?: string) => void
  placeholder?: string
  className?: string
  inputClassName?: string
  autoFocus?: boolean
}

// Remove acentos para comparação (suporte a "sao" encontrar "São Paulo")
function normalize(str: string) {
  return str
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Cidade ou estado...',
  className = '',
  inputClassName = '',
  autoFocus = false,
}: LocationAutocompleteProps) {
  const [allCities, setAllCities] = useState<Suggestion[]>([])
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Carrega todos os municípios brasileiros (IBGE) uma vez ao montar
  useEffect(() => {
    setLoading(true)
    fetch('/cidades-brasil.json')
      .then((r) => r.json())
      .then((d: { city: string; state: string }[]) => {
        setAllCities(
          d.map((c) => ({
            city: c.city,
            state: c.state,
            label: `${c.city}, ${c.state}`,
          }))
        )
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Fechar ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
        setHighlighted(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Filtra no cliente com normalização de acentos
  const filterSuggestions = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    if (!q || q.trim().length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }

    debounceRef.current = setTimeout(() => {
      const nq = normalize(q)
      const matches = allCities.filter(
        (c) =>
          normalize(c.city).includes(nq) ||
          normalize(c.state).includes(nq)
      ).slice(0, 10)

      setSuggestions(matches)
      setOpen(matches.length > 0)
      setHighlighted(-1)
    }, 150)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value
    onChange(v)
    filterSuggestions(v)
  }

  const handleSelect = (s: Suggestion) => {
    onChange(s.label, s.city, s.state)
    setOpen(false)
    setHighlighted(-1)
    inputRef.current?.blur()
  }

  const handleClear = () => {
    onChange('', '', '')
    setSuggestions([])
    setOpen(false)
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open || suggestions.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, -1))
    } else if (e.key === 'Enter' && highlighted >= 0) {
      e.preventDefault()
      handleSelect(suggestions[highlighted])
    } else if (e.key === 'Escape') {
      setOpen(false)
      setHighlighted(-1)
    }
  }

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <div className="flex items-center gap-2">
        {loading ? (
          <Loader2 className="w-5 h-5 text-indigo-400 animate-spin flex-shrink-0" />
        ) : (
          <MapPin className={cn('w-5 h-5 flex-shrink-0', value ? 'text-indigo-500' : 'text-gray-400')} />
        )}

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          spellCheck={false}
          className={cn(
            'flex-1 bg-transparent text-gray-900 placeholder-gray-400 text-sm outline-none',
            inputClassName
          )}
        />

        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Dropdown de sugestões */}
      {open && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <Search className="w-3 h-3" />
            Localizações encontradas
          </div>
          <ul>
            {suggestions.map((s, i) => (
              <li key={`${s.city}-${s.state}`}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelect(s)}
                  onMouseEnter={() => setHighlighted(i)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    highlighted === i
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <div className={cn(
                    'w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-xs font-bold',
                    highlighted === i ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500'
                  )}>
                    {s.state}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm leading-tight">{s.city}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{s.state} — Brasil</div>
                  </div>
                  <MapPin className="w-4 h-4 text-gray-300 ml-auto flex-shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

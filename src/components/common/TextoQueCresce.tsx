'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Caixa de texto que cresce junto com o que a pessoa escreve.
 *
 * As caixas tinham quatro linhas fixas e não podiam ser arrastadas, então o texto
 * rolava para dentro e dava a impressão de que havia um limite de caracteres.
 * Não havia — nem no formulário, nem no banco. Era só a caixa não acompanhar.
 */
export default function TextoQueCresce({
  name,
  defaultValue,
  placeholder,
  required,
  minLinhas = 4,
  dica,
}: {
  name: string
  defaultValue?: string | null
  placeholder?: string
  required?: boolean
  minLinhas?: number
  /** Texto de apoio sobre o tamanho ideal, à direita do contador */
  dica?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  const [tamanho, setTamanho] = useState(defaultValue?.length ?? 0)

  const ajustar = () => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  // Ajusta no primeiro desenho, para quem está editando um texto que já existe
  useEffect(ajustar, [])

  return (
    <div>
      <textarea
        ref={ref}
        name={name}
        required={required}
        rows={minLinhas}
        defaultValue={defaultValue ?? undefined}
        placeholder={placeholder}
        onInput={(e) => {
          ajustar()
          setTamanho(e.currentTarget.value.length)
        }}
        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-y overflow-hidden"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
        <span className="text-xs text-gray-400">
          {tamanho === 0 ? 'Sem limite de tamanho — escreva à vontade' : `${tamanho.toLocaleString('pt-BR')} caracteres`}
        </span>
        {dica && <span className="text-xs text-gray-400">{dica}</span>}
      </div>
    </div>
  )
}

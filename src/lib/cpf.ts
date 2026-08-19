// Validação de CPF (algoritmo oficial da Receita Federal)
export function validarCPF(cpf: string): boolean {
  const nums = cpf.replace(/\D/g, '')
  if (nums.length !== 11) return false
  if (/^(\d)\1+$/.test(nums)) return false // todos iguais

  let sum = 0
  for (let i = 0; i < 9; i++) sum += parseInt(nums[i]) * (10 - i)
  let d1 = (sum * 10) % 11
  if (d1 === 10 || d1 === 11) d1 = 0
  if (d1 !== parseInt(nums[9])) return false

  sum = 0
  for (let i = 0; i < 10; i++) sum += parseInt(nums[i]) * (11 - i)
  let d2 = (sum * 10) % 11
  if (d2 === 10 || d2 === 11) d2 = 0
  return d2 === parseInt(nums[10])
}

export function formatarCPF(cpf: string): string {
  const nums = cpf.replace(/\D/g, '').slice(0, 11)
  return nums
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
}

export function mascararCPF(cpf: string): string {
  const nums = cpf.replace(/\D/g, '')
  if (nums.length !== 11) return cpf
  return `***.${nums.slice(3, 6)}.${nums.slice(6, 9)}-**`
}

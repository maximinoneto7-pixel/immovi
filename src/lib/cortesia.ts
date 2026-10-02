// Prazos que o administrador pode liberar de cortesia.
//
// Fica aqui, e não junto da server action: um módulo 'use server' só pode exportar
// funções async, e qualquer constante exportada de lá chega ao navegador como stub.
export const PRAZOS = [30, 60, 90, 180, 365] as const

export type PrazoDeCortesia = (typeof PRAZOS)[number]

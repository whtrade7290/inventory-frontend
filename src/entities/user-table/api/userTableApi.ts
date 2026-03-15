import client from '../../../shared/api/client'
import type { UserTable, CreateUserTableDto } from '../model/types'

export const userTableApi = {
  getAll: () =>
    client.get<UserTable[]>('/tables').then((r) => r.data),

  create: (dto: CreateUserTableDto) =>
    client.post<UserTable>('/tables', dto).then((r) => r.data),

  rename: (id: number, name: string) =>
    client.patch<UserTable>(`/tables/${id}`, { name }).then((r) => r.data),

  delete: (id: number) =>
    client.delete(`/tables/${id}`),
}

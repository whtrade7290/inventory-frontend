import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/api/queryClient'
import { userTableApi } from '../api/userTableApi'
import type { CreateUserTableDto } from './types'

/** 테이블 목록 조회 */
export function useUserTables() {
  return useQuery({
    queryKey: queryKeys.userTables.all(),
    queryFn: userTableApi.getAll,
  })
}

/** 테이블 생성 */
export function useCreateUserTable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateUserTableDto) => userTableApi.create(dto),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.userTables.all() }),
  })
}

/** 테이블 이름 변경 */
export function useRenameUserTable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => userTableApi.rename(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.userTables.all() }),
  })
}

/** 테이블 삭제 */
export function useDeleteUserTable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => userTableApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.userTables.all() }),
  })
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../../shared/api/queryClient'
import { projectApi } from '../api/projectApi'
import type { CreateProjectDto } from './types'

/** 프로젝트 목록 조회 */
export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.all(),
    queryFn: projectApi.getAll,
  })
}

/** 프로젝트 상세 조회 — id가 null이면 비활성화 */
export function useProjectDetail(id: number | null) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id!),
    queryFn: () => projectApi.getById(id!),
    enabled: id !== null,
  })
}

/**
 * 프로젝트 등록 뮤테이션
 * 성공 시 프로젝트 목록과 재고 현황 캐시를 모두 무효화한다
 * (BOM 등록으로 stock_quantity가 변경되기 때문)
 */
export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (dto: CreateProjectDto) => projectApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.projects.all() })
      qc.invalidateQueries({ queryKey: queryKeys.stock.summary() })
    },
  })
}

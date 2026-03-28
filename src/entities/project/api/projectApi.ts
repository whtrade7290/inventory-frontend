import client from '../../../shared/api/client'
import type { Project, CreateProjectDto } from '../model/types'

export const projectApi = {
  /** 프로젝트 목록 조회 (BOM 아이템 포함, 부품 상세 값 미포함) */
  getAll: () =>
    client.get<Project[]>('/projects').then((r) => r.data),

  /** 프로젝트 상세 조회 (BOM 아이템 + 부품 셀 값 포함) */
  getById: (id: number) =>
    client.get<Project>(`/projects/${id}`).then((r) => r.data),

  /**
   * 프로젝트 등록
   * 백엔드에서 단일 트랜잭션으로 project 저장 + bom_item 저장 + stock_quantity 차감 처리
   * 재고 부족 시 400 응답으로 에러 메시지 반환
   */
  create: (dto: CreateProjectDto) =>
    client.post<Project>('/projects', dto).then((r) => r.data),
}

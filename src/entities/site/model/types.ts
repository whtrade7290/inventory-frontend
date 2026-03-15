/** 현장 (시공업체 소속) */
export interface Site {
  id: number
  name: string
  contractorId: number
  contractorName: string
  createdAt: string
}

export interface CreateSiteDto {
  name: string
  contractorId: number
}

/** 시공업체 */
export interface Contractor {
  id: number
  name: string
  createdAt: string
}

export interface CreateContractorDto {
  name: string
}

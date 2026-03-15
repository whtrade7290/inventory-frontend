/** 출고 기록 */
export interface OutboundRecord {
  id: number
  /** 부품 (inventory_item ID) */
  partId: number
  partName: string
  quantity: number
  contractorId: number
  contractorName: string
  siteId: number
  siteName: string
  outboundDate: string
  note?: string
  createdAt: string
}

export interface CreateOutboundDto {
  partId: number
  quantity: number
  contractorId: number
  siteId: number
  outboundDate: string
  note?: string
}

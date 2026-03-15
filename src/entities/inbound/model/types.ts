/** 입고 기록 */
export interface InboundRecord {
  id: number
  /** 부품 (inventory_item ID) */
  partId: number
  partName: string
  quantity: number
  supplier: string
  inboundDate: string
  note?: string
  createdAt: string
}

export interface CreateInboundDto {
  partId: number
  quantity: number
  supplier: string
  inboundDate: string
  note?: string
}

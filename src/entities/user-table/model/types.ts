/** 사용자 정의 테이블 */
export interface UserTable {
  id: number
  name: string
  createdAt: string
  updatedAt: string
}

export interface CreateUserTableDto {
  name: string
}

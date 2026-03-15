import axios from 'axios'

/**
 * 공통 axios 인스턴스
 * - baseURL: /api (vite proxy → localhost:8080)
 * - 멀티테넌시 확장 시 X-Tenant-ID 헤더를 인터셉터로 추가
 */
const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// TODO: SaaS 멀티테넌시 구현 시 tenant ID 헤더 주입
// client.interceptors.request.use((config) => {
//   const tenantId = getTenantId()
//   if (tenantId) config.headers['X-Tenant-ID'] = tenantId
//   return config
// })

// TODO: 인증 구현 시 JWT 토큰 주입
// client.interceptors.request.use((config) => {
//   const token = getAccessToken()
//   if (token) config.headers.Authorization = `Bearer ${token}`
//   return config
// })

export default client

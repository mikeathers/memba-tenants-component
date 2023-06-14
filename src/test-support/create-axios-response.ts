export const createAxiosResponse = <T>(status: number, data?: T) => ({
  status,
  data,
  statusText: '',
  headers: {},
  config: {},
})

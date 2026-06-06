export function companyChannel(companyUuid: string) {
  return `company.${companyUuid}`;
}

export function companyOrdersChannel(companyUuid: string) {
  return `company.${companyUuid}.orders`;
}

export function orderChannel(orderPublicId: string) {
  return `order.${orderPublicId}`;
}

export function driverChannel(driverPublicId: string) {
  return `driver.${driverPublicId}`;
}

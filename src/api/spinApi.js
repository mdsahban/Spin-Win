import { base44 } from '@/api/base44Client';

const unwrap = (p) => p.then((r) => (r && r.data !== undefined ? r.data : r));

export const getPublicCampaign = () => unwrap(base44.functions.invoke('getPublicCampaign', {}));
export const verifyCustomer = (name, phone) =>
  unwrap(base44.functions.invoke('verifyCustomer', { name, phone }));
export const processSpin = (customerId) =>
  unwrap(base44.functions.invoke('processSpin', { customerId }));
export const getAdminStats = () => unwrap(base44.functions.invoke('adminStats', {}));
export const getCustomerHistory = (phone) =>
  unwrap(base44.functions.invoke('getCustomerHistory', { phone }));
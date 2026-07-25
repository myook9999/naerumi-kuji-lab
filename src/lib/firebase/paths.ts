import { hospital } from "@/config/hospital";

export const firebasePaths = {
  boardSnapshot: hospital.boardSnapshotPath,
  webRoot: hospital.webRootPath,
  admins: `${hospital.webRootPath}/admins`,
  members: `${hospital.webRootPath}/members`,
  pointLogs: `${hospital.webRootPath}/pointLogs`,
  treatmentLogs: `${hospital.webRootPath}/treatmentLogs`,
  winnings: `${hospital.webRootPath}/winnings`,
  shippingAddresses: `${hospital.webRootPath}/shippingAddresses`,
  treatmentSettings: `${hospital.webRootPath}/settings/treatment`,
  settings: `${hospital.webRootPath}/settings`,
} as const;

export function memberPath(uid: string) {
  return `${firebasePaths.members}/${uid}`;
}

export function adminPath(uid: string) {
  return `${firebasePaths.admins}/${uid}`;
}

export function winningPath(id: string) {
  return `${firebasePaths.winnings}/${id}`;
}

export function shippingAddressPath(uid: string) {
  return `${firebasePaths.shippingAddresses}/${uid}`;
}

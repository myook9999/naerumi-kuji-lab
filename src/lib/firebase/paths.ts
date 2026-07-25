import { hospital } from "@/config/hospital";

export const firebasePaths = {
  boardSnapshot: hospital.boardSnapshotPath,
  webRoot: hospital.webRootPath,
  admins: `${hospital.webRootPath}/admins`,
  members: `${hospital.webRootPath}/members`,
  pointLogs: `${hospital.webRootPath}/pointLogs`,
  treatmentLogs: `${hospital.webRootPath}/treatmentLogs`,
  treatmentSettings: `${hospital.webRootPath}/settings/treatment`,
  settings: `${hospital.webRootPath}/settings`,
} as const;

export function memberPath(uid: string) {
  return `${firebasePaths.members}/${uid}`;
}

export function adminPath(uid: string) {
  return `${firebasePaths.admins}/${uid}`;
}

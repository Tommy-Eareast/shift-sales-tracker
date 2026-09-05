import { bvlgariProfile } from './bvlgariProfile';
import { dolceGabbanaProfile } from './dolceGabbanaProfile';
import { diorProfile } from './diorProfile';
import { amouageProfile } from './amouageProfile';
import { defaultProfile } from './defaultProfile';
import type { ExportProfile } from './types';

export const exportProfiles: ExportProfile[] = [
    bvlgariProfile,
    dolceGabbanaProfile,
    diorProfile,
    amouageProfile,
    defaultProfile,
];

export function getExportProfileById(profileId: string): ExportProfile {
    return exportProfiles.find(p => p.profileId === profileId) || defaultProfile;
}

export function getExportProfile(templateName: string): ExportProfile {
    return exportProfiles.find(p => p.templateName === templateName) || defaultProfile;
}

export type { ExportProfile, ProfileInput } from './types';
export { getProfileForTemplate } from './templateMapping';

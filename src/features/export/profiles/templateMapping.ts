/**
 * HARDCODED TEMPLATE → EXPORT PROFILE MAPPING
 *
 * This file maps template names to export profile IDs.
 * When a new template is created, the system automatically assigns
 * the export profile based on the template name.
 *
 * TO ADD A NEW BRAND:
 * 1. Create a new profile file in `./` (e.g., `diorProfile.ts`)
 * 2. Register it in `./index.ts`
 * 3. Add the template name mapping below
 *
 * Example:
 *   "Dior": "dior",
 */
export const templateProfileMapping: Record<string, string> = {
    Interparfum: 'interparfum',
    Prestige: 'prestige',
    'Dolce Gabbana': 'dolceGabbana',
    Bvlgari: 'bvlgari',
    Dior: 'dior',
    Amouage: 'amouage',
};

export function getProfileForTemplate(templateName: string): string {
    return templateProfileMapping[templateName] || 'default';
}

export type PricingMode = 'fixed' | 'estimated' | 'quote';

export type ComposeMode = 'simple' | 'complex';

/**
 * Detailed mission fields captured by the "פרטים מלאים" modal.
 * Mirrors the shape used by mission.svelte (skills/roles/workways/links/notes)
 * but is local-only — no server side-effects until the product itself is saved.
 */
export type MissionExtraDetails = {
  descripRich: string;
  skills: string[];      // skill names — server action resolves to IDs
  roles: string[];       // tafkidim roleDescriptions
  workways: string[];    // workWayName values
  hearotMeyuchadot: string;
  publicklinks: string;
  privatlinks: string;
  startDate: string | null;
  endDate: string | null;
};

export type ResourceExtraDetails = {
  descripRich: string;
  spnot: string;
  linkto: string;
  easy: number;          // minimum / "easy" price
  startDate: string | null;
  endDate: string | null;
};

export type RecipeMissionRow = {
  missionId: string | null;
  mesimabetahalichId: string | null;
  name: string;
  hoursPerUnit: number;
  unitsPerProduct: number;
  ratePerHour: number;
  mode: 'createNew' | 'consumeExisting';
  assignedMemberId: string | null;
  onlyPartOf: boolean; // mission stays inactive until product is purchased
  notes: string;
  extraDetails: MissionExtraDetails | null;
};

export type AvailableMission = {
  id: string;
  attributes: {
    name: string;
    perhour?: number | null;
    howmanyhoursalready?: number | null;
    hoursassinged?: number | null;
    users_permissions_user?: {
      data?: { id: string; attributes: { username: string } } | null;
    };
  };
};

export type ProjectMember = {
  id: string;
  attributes: {
    username: string;
    profilePic?: { data?: { attributes?: { url?: string } } | null };
  };
};

/**
 * Catalog mission template (from getMissionTemplates) used to power
 * autocomplete on the "new mission" row in the complex-product form.
 * Mirrors the shape consumed by mission.svelte's `missionTemplates` prop.
 */
export type MissionTemplate = {
  id: string;
  attributes: {
    missionName: string;
    descrip?: string | null;
    perhour?: number | null;
    skills?: {
      data?: Array<{
        attributes: {
          skillName: string;
          localizations?: { data?: Array<{ attributes: { skillName: string } }> };
        };
      }>;
    };
    tafkidims?: {
      data?: Array<{
        attributes: {
          roleDescription: string;
          localizations?: { data?: Array<{ attributes: { roleDescription: string } }> };
        };
      }>;
    };
    work_ways?: {
      data?: Array<{
        attributes: {
          workWayName: string;
          localizations?: { data?: Array<{ attributes: { workWayName: string } }> };
        };
      }>;
    };
  };
};

/**
 * Catalog resource template (from getMashaabims) used to power autocomplete
 * on the "new resource" row in the complex-product form. Mirrors the shape
 * consumed by ResourceCreator.svelte's `mashaabimTemplates`.
 */
export type ResourceTemplate = {
  id: string;
  attributes: {
    name: string;
    descrip?: string | null;
    price?: number | null;
    kindOf?: string | null;
    linkto?: string | null;
  };
};

/**
 * In-progress resource that already exists in the project — either an
 * OpenMashaabim (single-member) or a Pmash (multi-member). Picked from the
 * dropdown when the row mode = 'consumeExisting'.
 */
export type AvailableResource = {
  id: string;
  source: 'openMashaabim' | 'pmash';
  attributes: {
    name: string;
    descrip?: string | null;
    kindOf?: string | null;
    price?: number | null;
    easy?: number | null;
    hm?: number | null;
    spnot?: string | null;
    linkto?: string | null;
    sqadualed?: string | null;
    sqadualedf?: string | null;
    users?: Array<{
      what?: boolean;
      users_permissions_user?: { data?: { id: string } | null };
    }>;
  };
};

export type RecipeResourceRow = {
  pmashId: string | null;
  openMashaabimId: string | null;
  name: string;
  quantityPerUnit: number;
  pricePerUnit: number;
  kindOf: 'service' | 'good' | 'subscription' | 'other';
  mode: 'createNew' | 'consumeExisting';
  assignedMemberId: string | null;
  onlyPartOf: boolean;
  notes: string;
  extraDetails: ResourceExtraDetails | null;
};

export type ComposeProductPayload = {
  projectId: string;
  name: string;
  desc: string;
  pricingMode: PricingMode;
  marginPct: number;
  currency: string;
  estimatedPrice: number;
  recipeMissions: RecipeMissionRow[];
  recipeResources: RecipeResourceRow[];
};

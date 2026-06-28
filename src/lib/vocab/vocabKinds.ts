/**
 * Single source of truth for "vocabulary" entities — the shared, user-extendable
 * catalogs (skills / values / roles / ways-of-creation) that appear in many
 * places across the app (registration, onboarding, mission & project creation,
 * profile editing).
 *
 * This module is SERVER-SAFE: it holds only plain metadata and imports no Svelte
 * stores, so it can be used by both the API endpoints and the UI. The client
 * store mapping lives in the component.
 */

export type VocabKind = 'skills' | 'vallues' | 'roles' | 'workways';

export interface VocabKindMeta {
	/** Strapi collection (plural API id), used in GraphQL + REST paths */
	collection: string;
	/** The translatable name field on the entity */
	nameField: string;
	/** GraphQL create mutation name */
	createMutation: string;
	/** Pinecone namespace for semantic duplicate detection */
	pineconeNamespace: 'skills' | 'vallues' | 'roles' | 'work_ways';
	/** Optional free-text description field (e.g. 'descrip') */
	descriptionField?: string;
	/** Whitelisted relation fields the create endpoint may set ([ID] lists) */
	relationFields?: string[];
	/** contentType passed to /api/translations (Strapi REST plural id). Omit to skip auto-translation. */
	translationContentType?: string;
	/** Suffix for tr.selector keys: identical<Suffix> / similar<Suffix> (selector kinds only) */
	i18nSuffix?: 'Skill' | 'Value' | 'Role' | 'Workway';
	/** tr.selector key for the search placeholder (selector kinds only) */
	searchKey?: 'searchSkills' | 'searchValues' | 'searchRoles' | 'searchWorkways';
	/** Hebrew telemetry verb sent to /api/ste (owner notification) */
	telemetryVerb: string;
}

export const VOCAB_KINDS: Record<VocabKind, VocabKindMeta> = {
	skills: {
		collection: 'skills',
		nameField: 'skillName',
		createMutation: 'createSkill',
		pineconeNamespace: 'skills',
		descriptionField: 'descrip',
		relationFields: ['tafkidims'],
		translationContentType: 'skills',
		i18nSuffix: 'Skill',
		searchKey: 'searchSkills',
		telemetryVerb: 'יצר כישור חדש דרך multiselect בשם:'
	},
	vallues: {
		collection: 'vallues',
		nameField: 'valueName',
		createMutation: 'createVallue',
		pineconeNamespace: 'vallues',
		descriptionField: 'descrip',
		translationContentType: 'vallues',
		i18nSuffix: 'Value',
		searchKey: 'searchValues',
		telemetryVerb: 'יצר ערך חדש דרך multiselect בשם:'
	},
	roles: {
		collection: 'tafkidims',
		nameField: 'roleDescription',
		createMutation: 'createTafkidim',
		pineconeNamespace: 'roles',
		descriptionField: 'descrip',
		relationFields: ['skills'],
		translationContentType: 'tafkidims',
		i18nSuffix: 'Role',
		searchKey: 'searchRoles',
		telemetryVerb: 'יצר תפקיד חדש דרך multiselect בשם:'
	},
	workways: {
		collection: 'workWays',
		nameField: 'workWayName',
		createMutation: 'createWorkWay',
		pineconeNamespace: 'work_ways',
		// no description / no relations / no auto-translation (matches legacy behavior)
		i18nSuffix: 'Workway',
		searchKey: 'searchWorkways',
		telemetryVerb: 'יצר דרך יצירה חדשה בשם:'
	}
};

/** Type guard — validates an untrusted `kind` value from a request. */
export function isVocabKind(value: unknown): value is VocabKind {
	return typeof value === 'string' && value in VOCAB_KINDS;
}

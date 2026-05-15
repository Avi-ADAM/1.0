import type { PageServerLoad } from './$types';

export interface HubKpi {
  votes: number;
  urgent: number;
  suggestions: number;
  activePurchases: number;
  activeSales: number;
}

export interface HubSummary {
  kpi: HubKpi;
  topFive: any[];
  username: string;
  profilePic?: string;
}

// M2 will replace this with a real lean GraphQL query (85levHubSummary)
async function fetchHubSummary(
  _uid: string,
  _tok: string,
  _lang: string
): Promise<HubSummary> {
  return {
    kpi: {
      votes: 4,
      urgent: 1,
      suggestions: 7,
      activePurchases: 2,
      activeSales: 3
    },
    topFive: [],
    username: '',
    profilePic: undefined
  };
}

export const load: PageServerLoad = async ({ locals }) => {
  const uid = locals.uid ?? '';
  const tok = locals.tok ?? '';
  const lang = locals.lang ?? 'he';

  const summary = fetchHubSummary(uid, tok, lang);

  return {
    streamed: { summary }
  };
};

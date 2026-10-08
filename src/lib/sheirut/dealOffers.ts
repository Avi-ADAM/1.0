/**
 * The deal page's view of the parts of a deal still open in its rikma (QA C-19) — the
 * shape `$lib/server/deal/dealOffers` reads qid 417 into. Shared with the page.
 */

export interface DealCandidacyView {
  side: 'ask' | 'askm';
  id: string;
  candidateId: string;
  candidateName: string;
  candidatePic: string | null;
  /** Hours (missions) / quantity (resources) of the standing round. */
  amount: number;
  /** Rate per hour / unit price of the standing round. */
  unitPrice: number;
  /** What it adds to the deal if it materializes on these terms. */
  price: number;
  /** The standing round (latest `ordern`, 0 before any counter) — what a signature signs. */
  round: number;
  /** The viewer (a customer) already signed this round. */
  signedByViewer: boolean;
  /** Customers still to sign this round. */
  clientsPending: number;
  membersSigned: boolean;
  candidateAgreed: boolean;
  approvable: boolean;
}

export interface DealOpenOfferView {
  kind: 'mission' | 'resource';
  offerId: string;
  name: string;
  amount: number;
  unitPrice: number;
  candidacies: DealCandidacyView[];
}

export interface DealOffersView {
  customerIds: string[];
  offers: DealOpenOfferView[];
}

// Rikma events — webinars, workshops, open meetings
// (docs/inprogress/PLAN_EVENTS_WEBINARS.md). Spread into `qids` in qids.js;
// dependency-free for the same reason qids.js is (the scripts import it under
// plain node).
//
// Every one is `serviceAdmin` in qidsAccess.js. A session carries the join
// link (`externalUrl`) and a registration carries a person's email and phone,
// so they run only inside the event actions and loaders, under the service
// token, after a membership check or a registrant's own token — and the
// public page reads the event through `$lib/events/model` (`toEventView`
// without secrets), never the raw row. Never widen these to `user`.

const SESSION = `sessions { key startsAt durationMin timezone capacity room externalUrl recordingUrl state pgisha { data { id } } }`;

const EVENT_FIELDS = `
  slug kind title tagline description outcomes audience form consentText afterUrl status lifecycle lang
  publishedOn createdAt updatedAt
  project { data { id attributes { projectName slug restime } } }
  decision { data { id } }
  cover { data { id attributes { url } } }
  hosts { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
  agenda { minutes title desc }
  faq { q a }
  ${SESSION}
`;

const REGISTRATION_FIELDS = `
  sessionKey name email phone answers status joinedAt sent lang createdAt ref
  event { data { id } }
  lead { data { id } }
`;

export const eventsQids = {
  // Are the collections deployed? A missing type fails validation; an empty table answers [].
  'eventsSchemaLive': `query EventsSchemaLive {
    rikmaEvents(pagination: { limit: 1 }) { data { id } }
  }`,

  'eventById': `query EventById($id: ID!) {
    rikmaEvent(id: $id) { data { id attributes { ${EVENT_FIELDS} } } }
  }`,

  'eventBySlug': `query EventBySlug($pid: ID!, $slug: String!) {
    rikmaEvents(
      filters: { project: { id: { eq: $pid } }, slug: { eq: $slug } }
      pagination: { limit: 1 }
    ) { data { id attributes { ${EVENT_FIELDS} } } }
  }`,

  // A rikma's events — the member list and the public "upcoming" strip
  // (which drops drafts and archived rows in code, after toEventView).
  'eventsOfProject': `query EventsOfProject($pid: ID!) {
    rikmaEvents(
      filters: { project: { id: { eq: $pid } } }
      sort: ["createdAt:desc"]
      pagination: { limit: 100 }
    ) { data { id attributes { ${EVENT_FIELDS} } } }
  }`,

  'eventCreate': `mutation EventCreate($data: RikmaEventInput!) {
    createRikmaEvent(data: $data) { data { id attributes { slug status } } }
  }`,

  'eventUpdate': `mutation EventUpdate($id: ID!, $data: RikmaEventInput!) {
    updateRikmaEvent(id: $id, data: $data) { data { id attributes { slug status } } }
  }`,

  // Seats: only the session and the status, for counting (no contact details).
  'eventSeats': `query EventSeats($eid: ID!) {
    eventRegistrations(
      filters: { event: { id: { eq: $eid } } }
      pagination: { limit: 5000 }
    ) { data { id attributes { sessionKey status } } }
  }`,

  // The members' list of who registered (the moach event page).
  'eventRegistrationsOfEvent': `query EventRegistrationsOfEvent($eid: ID!) {
    eventRegistrations(
      filters: { event: { id: { eq: $eid } } }
      sort: ["createdAt:asc"]
      pagination: { limit: 5000 }
    ) { data { id attributes { ${REGISTRATION_FIELDS} } } }
  }`,

  // The same person for the same date again — answered with the first row.
  'eventRegistrationFind': `query EventRegistrationFind($eid: ID!, $email: String!) {
    eventRegistrations(
      filters: { event: { id: { eq: $eid } }, email: { eqi: $email } }
      pagination: { limit: 20 }
    ) { data { id attributes { sessionKey status token } } }
  }`,

  // The registrant's own page: everything is reached through the token.
  'eventRegistrationByToken': `query EventRegistrationByToken($token: String!) {
    eventRegistrations(filters: { token: { eq: $token } }, pagination: { limit: 1 }) {
      data { id attributes {
        ${REGISTRATION_FIELDS}
        event { data { id attributes { ${EVENT_FIELDS} } } }
      } }
    }
  }`,

  'eventRegistrationCreate': `mutation EventRegistrationCreate($data: EventRegistrationInput!) {
    createEventRegistration(data: $data) { data { id attributes { status token } } }
  }`,

  'eventRegistrationUpdate': `mutation EventRegistrationUpdate($id: ID!, $data: EventRegistrationInput!) {
    updateEventRegistration(id: $id, data: $data) { data { id attributes { status } } }
  }`,

  // The reminder clock (/api/cron/events, W3): every published event with its
  // dates, and per event the rows with what they were already sent.
  'eventsForCron': `query EventsForCron {
    rikmaEvents(
      filters: { status: { eq: "published" } }
      sort: ["id:asc"]
      pagination: { limit: 500 }
    ) { data { id attributes {
      slug title tagline afterUrl lifecycle hosts { data { id } }
      project { data { id attributes { slug } } }
      ${SESSION}
    } } }
  }`,

  'eventRegistrationsForCron': `query EventRegistrationsForCron($eid: ID!) {
    eventRegistrations(
      filters: { event: { id: { eq: $eid } } }
      sort: ["createdAt:asc"]
      pagination: { limit: 5000 }
    ) { data { id attributes {
      sessionKey name email status joinedAt sent lang createdAt token
      lead { data { id } }
    } } }
  }`,

  // Publishing on everyone's behalf rides the Decision model (kind 'event').
  'eventCreateDecision': `mutation EventCreateDecision(
    $projectIds: [ID]
    $publishedAt: DateTime
    $decisionName: String
    $eventId: ID
    $vots: [ComponentProjectsVotsInput]
  ) {
    createDecision(data: {
      projects: $projectIds
      publishedAt: $publishedAt
      decisionName: $decisionName
      kind: event
      rikma_event: $eventId
      vots: $vots
    }) { data { id } }
  }`,

  'eventDecision': `query EventDecision($id: ID!) {
    decision(id: $id) {
      data { id attributes {
        kind archived
        projects { data { id } }
        rikma_event { data { id attributes { title slug status project { data { id } } } } }
      } }
    }
  }`
};

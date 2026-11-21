// An act as an outside agent works it (docs/tbd/PLAN_AGENT_WORK.md, AW1).
// Spread into `qids` in qids.js; dependency-free for the same reason qids.js is
// (the scripts import it under plain node).
//
// Every one of these is `serviceAdmin` in qidsAccess.js. They run only inside
// the MCP task tools (src/mastra/tools/agentTaskTools.ts) and the claimTask /
// reportTask actions (src/lib/server/actions/configs/agentTasks.ts), after
// those resolved the key owner — a direct /api/send call could otherwise read
// any user's tasks by id.

const ACT_FIELDS = `
  shem des link hashivut dateS dateF status naasa myIshur valiIshur isAssigned source externalId createdAt updatedAt
  my { data { id attributes { username nameLatin nameArabic nameCyrillic nameHebrew } } }
  vali { data { id attributes { username nameLatin nameArabic nameCyrillic nameHebrew } } }
  tafkidims(pagination: { limit: 20 }) { data { id attributes { roleDescription } } }
  mesimabetahaliches(pagination: { limit: 10 }) { data { id attributes { name users_permissions_user { data { id } } } } }
  forums(pagination: { limit: 5 }) { data { id } }
  timegrama { data { id attributes { date done whatami } } }
`;

export const agentTaskQids = {
  // The acts that concern one user, in the rikmas they belong to: assigned to
  // them, validated by them, or open to a role (the caller keeps only the roles
  // the user holds). Newest activity first; the tool narrows further.
  agentTasksFor: `query AgentTasksFor($uid: ID!, $limit: Int = 150) {
    acts(
      filters: { and: [
        { project: { user_1s: { id: { eq: $uid } } } },
        { or: [
          { my: { id: { eq: $uid } } },
          { vali: { id: { eq: $uid } } },
          { and: [
            { or: [ { isAssigned: { eq: false } }, { isAssigned: { null: true } } ] },
            { tafkidims: { id: { notNull: true } } }
          ] }
        ] }
      ] }
      sort: ["updatedAt:desc"]
      pagination: { limit: $limit }
    ) { data { id attributes {
      ${ACT_FIELDS}
      project { data { id attributes { projectName } } }
    } } }
  }`,

  // One act, with who may see it (the rikma's members) and the rikma's own links.
  agentTaskById: `query AgentTaskById($id: ID!) {
    act(id: $id) {
      data { id attributes {
        ${ACT_FIELDS}
        project { data { id attributes {
          projectName githublink drivelink restime
          user_1s(pagination: { limit: 200 }) { data { id } }
        } } }
      } }
    }
  }`,

  // What was finished lately in the rikma — "what came before" for an agent
  // starting a new act there.
  agentRecentDoneTasks: `query AgentRecentDoneTasks($pid: ID!, $limit: Int = 5) {
    acts(
      filters: { and: [ { project: { id: { eq: $pid } } }, { naasa: { eq: true } } ] }
      sort: ["updatedAt:desc"]
      pagination: { limit: $limit }
    ) { data { id attributes {
      shem updatedAt valiIshur
      my { data { id attributes { username nameLatin nameArabic nameCyrillic nameHebrew } } }
      forums(pagination: { limit: 1 }) { data { id } }
    } } }
  }`,

  // The thread an act's reports live in. A forum hung on the rikma and the act;
  // its subject only names it (ACT::<id>::<name>).
  agentActForumCreate: `mutation AgentActForumCreate($pid: ID!, $actId: ID!, $subject: String, $da: DateTime) {
    createForum(data: { project: $pid, acts: [$actId], subject: $subject, publishedAt: $da }) { data { id } }
  }`,

  // ── The validation clock (whatami "act"; src/lib/server/acts/validationClock.ts).
  // The dispatcher tells it apart from an automatic act's reminder by
  // `fulfillment_step`, which only automatic acts carry.
  agentActValidationState: `query AgentActValidationState($id: ID!) {
    act(id: $id) { data { id attributes {
      shem naasa valiIshur
      project { data { id } }
      my { data { id } }
      vali { data { id } }
      fulfillment_step { data { id } }
    } } }
  }`,

  // Open clocks of one act. `done` is false or never written — a bare `ne: true`
  // would drop the NULL rows.
  agentActOpenClocks: `query AgentActOpenClocks($act: ID!) {
    timegramas(
      filters: { and: [
        { act: { id: { eq: $act } } },
        { whatami: { eq: "act" } },
        { or: [ { done: { eq: false } }, { done: { null: true } } ] }
      ] }
      pagination: { limit: 20 }
    ) { data { id } }
  }`,

  agentActClockCreate: `mutation AgentActClockCreate($date: DateTime!, $act: ID!) {
    createTimegrama(data: { date: $date, done: false, whatami: "act", act: $act }) { data { id } }
  }`,

  agentClockClose: `mutation AgentClockClose($id: ID!) {
    updateTimegrama(id: $id, data: { done: true }) { data { id } }
  }`,

  // ── A running timer's acts: which tasks its hours are for. timerSave files
  // them (`tasks`), and its dialog starts from what is already on the timer.
  agentTimerActs: `query AgentTimerActs($id: ID!) {
    timer(id: $id) { data { id attributes {
      isActive saved
      users_permissions_user { data { id } }
      acts { data { id } }
    } } }
  }`,

  agentTimerSetActs: `mutation AgentTimerSetActs($id: ID!, $acts: [ID]) {
    updateTimer(id: $id, data: { acts: $acts }) { data { id } }
  }`,

  // getMissionDetailsTool: a mission in progress with its acts and its rikma.
  // Members only: the MCP guard checks it (mission: 'member'), and the tool checks
  // it again from `user_1s` — the in-app bot does not pass through the guard.
  agentMissionDetails: `query AgentMissionDetails($missionId: ID!) {
    mesimabetahalich(id: $missionId) {
      data { id attributes {
        name descrip
        project { data { id attributes { projectName user_1s(pagination: { limit: 200 }) { data { id } } } } }
        users_permissions_user { data { id } }
        activeTimer { data { id attributes { isActive } } }
        acts(pagination: { limit: 50 }) { data { id attributes { shem naasa valiIshur } } }
      } }
    }
  }`,

  // The last messages of an act's thread, to read its reports back.
  agentActForumMessages: `query AgentActForumMessages($fid: ID!, $limit: Int = 40) {
    messages(
      filters: { forum: { id: { eq: $fid } } }
      sort: ["createdAt:desc"]
      pagination: { limit: $limit }
    ) { data { id attributes {
      content createdAt
      users_permissions_user { data { id attributes { username nameLatin nameArabic nameCyrillic nameHebrew } } }
    } } }
  }`
};

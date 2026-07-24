// GENERATED DRAFT — created by scripts/build-qids-access.mjs, then human-reviewed.
// Maps every qid in qids.js to the principal kinds allowed to run it via /api/send.
// Kinds: 'user' (cookie JWT) | 'serviceAdmin' (isSer + internal secret) |
//        'serviceConsensus' (isSer + x-consensus-secret) | 'apiKey' (Bearer 1lev1_…).
// A qid missing here fails the coverage test (qidsAccess.test.ts) — classify it consciously.
// Enforcement mode is controlled by AUTHZ_MODE (off | log | enforce), see src/lib/server/authz/.

export const qidsAccess = {
  '85levHubSummary': { allow: ['user', 'serviceAdmin'] },
  '87levSliceSheirutp': { allow: ['user', 'serviceAdmin'] },
  '87levSliceSales': { allow: ['user', 'serviceAdmin'] },
  '87levSliceFiapp': { allow: ['user', 'serviceAdmin'] },
  '87levSliceDecisions': { allow: ['user', 'serviceAdmin'] },
  '87levSlicePends': { allow: ['user', 'serviceAdmin'] },
  '87levSliceWegets': { allow: ['user', 'serviceAdmin'] },
  '87levSliceAskedResources': { allow: ['user', 'serviceAdmin'] },
  '87levSliceHalukas': { allow: ['user', 'serviceAdmin'] },
  '87levSliceMtaha': { allow: ['user', 'serviceAdmin'] },
  '87levSlicePurchases': { allow: ['user', 'serviceAdmin'] },
  '200findMissionsBySkill': { allow: ['user', 'serviceAdmin'] },
  '201findUsersBySkill': { allow: ['user', 'serviceAdmin'] },
  '202findAvailableSp': { allow: ['user', 'serviceAdmin'] },
  '203findMatanotByText': { allow: ['user', 'serviceAdmin'] },
  '204getAllMashaabims': { allow: ['user', 'serviceAdmin'] },
  '205getMashaabimsByIds': { allow: ['user', 'serviceAdmin'] },
  '206getSpForEdit': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '220mapJoinableRatsons': { allow: ['user', 'serviceAdmin'] },
  '221mapOpenMissions': { allow: ['user', 'serviceAdmin'] },
  '222mapOpenMashaabims': { allow: ['user', 'serviceAdmin'] },
  '223mapMaagadim': { allow: ['user', 'serviceAdmin'] },
  '224crMaagad': { allow: ['user', 'serviceAdmin'] },
  '225crMaagadMember': { allow: ['user', 'serviceAdmin'] },
  '226updateMaagadMember': { allow: ['user', 'serviceAdmin'] },
  '235crMaagadSheirutpend': { allow: ['user', 'serviceAdmin'] },
  '227crMaagadOffer': { allow: ['user', 'serviceAdmin'] },
  '228updateMaagadOffer': { allow: ['user', 'serviceAdmin'] },
  '229queryMaagadFull': { allow: ['user', 'serviceAdmin'] },
  '230updateMaagad': { allow: ['user', 'serviceAdmin'] },
  '232listExpiredOpenOffers': { allow: ['user', 'serviceAdmin'] },
  '231queryMyMaagadMember': { allow: ['user', 'serviceAdmin'] },
  '233listOpenRatsonsForClustering': { allow: ['user', 'serviceAdmin'] },
  '234getProjectLocation': { allow: ['user', 'serviceAdmin'] },
  '250getUserPersonalProject': { allow: ['user', 'serviceAdmin'] },
  '251setUserPersonalProject': { allow: ['user', 'serviceAdmin'] },
  '252getSpForPublish': { allow: ['user', 'serviceAdmin'] },
  '253createPersonalMatanotFromSp': { allow: ['user', 'serviceAdmin'] },
  '254updateSpOfferState': { allow: ['user', 'serviceAdmin'] },
  '255setMatanotArchived': { allow: ['user', 'serviceAdmin'] },
  '258listMyMissionOffers': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '259createMissionOffer': { allow: ['user', 'serviceAdmin'] },
  '260updateMissionOffer': { allow: ['user', 'serviceAdmin'] },
  '261findMissionByName': { allow: ['user', 'serviceAdmin'] },
  '262getUserMissionsICanDo': { allow: ['user', 'serviceAdmin'] },
  '263setUserMissionsICanDo': { allow: ['user', 'serviceAdmin'] },
  '264getMissionOffer': { allow: ['user', 'serviceAdmin'] },
  '265listMyPersonalMatanots': { allow: ['user', 'serviceAdmin'] },
  '276myOfferingsViaUser': { allow: ['user', 'serviceAdmin'] },
  '277myMissionOffersViaUser': { allow: ['user', 'serviceAdmin'] },
  '278myMissionsViaUser': { allow: ['user', 'serviceAdmin'] },
  '272myOfferingsCounts': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '273myMissionsFull': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '274getProjectMembers': { allow: ['user', 'serviceAdmin'] },
  '275myRikmasLite': { allow: ['user', 'serviceAdmin'] },
  '271findMissionOffersByText': { allow: ['serviceAdmin'] }, // server-only callers
  '270findMissionOffersByMission': { allow: ['user', 'serviceAdmin'] },
  '269mapProducts': { allow: ['user', 'serviceAdmin'] },
  '268getUserStorefront': { allow: ['serviceAdmin'] }, // server-only callers
  '267setMaagadOfferProposerProject': { allow: ['user', 'serviceAdmin'] },
  '266getMatanotSellerMeta': { allow: ['user', 'serviceAdmin'] },
  '257getSpForEditWithOffer': { allow: ['user', 'serviceAdmin'] },
  '256syncPersonalMatanotFromSp': { allow: ['user', 'serviceAdmin'] },
  'createSaleRecord': { allow: ['user', 'serviceAdmin'] },
  'updateMatanotQuant': { allow: ['user', 'serviceAdmin'] },
  'createMonterForSale': { allow: ['user', 'serviceAdmin'] },
  // Recurring sales (PLAN_RECURRING_SALES) — monthi-only qids are serviceAdmin;
  // report/confirm qids run inside actions with the user's JWT (entity-level
  // holder/customer checks live in the action handlers).
  'mrsListRecurringSaleEngines': { allow: ['serviceAdmin'] },
  'mrsCreateCycleSale': { allow: ['serviceAdmin'] },
  'mrsCloseRecurringSale': { allow: ['user', 'serviceAdmin'] },
  'mrsGetCycleForReport': { allow: ['user', 'serviceAdmin'] },
  'mrsReportCycleSale': { allow: ['user', 'serviceAdmin'] },
  'mrsCustomerReportCycle': { allow: ['user', 'serviceAdmin'] },
  'saleCenterPendingCycles': { allow: ['user', 'serviceAdmin'] },
  'dealsCustomerPendingCycles': { allow: ['user', 'serviceAdmin'] },
  'mrsFindCustomer': { allow: ['user', 'serviceAdmin'] },
  'saleClaimProjectInfo': { allow: ['user', 'serviceAdmin'] },
  'updateProjectSupportPage': { allow: ['serviceAdmin'] }, // server-only callers (setSupportPage action via StrapiClient)
  'createDonationSaleRecord': { allow: ['serviceAdmin'] }, // server-only callers (createDonationSale action via StrapiClient)
  'donationProjectInfo': { allow: ['serviceAdmin'] }, // server-only callers (donation actions via StrapiClient)
  'createSaleClaimDecision': { allow: ['user', 'serviceAdmin'] },
  'updateSaleHolderLink': { allow: ['user', 'serviceAdmin'] },
  'getSaleClaimDecision': { allow: ['user', 'serviceAdmin'] },
  'updateSaleClaimNego': { allow: ['user', 'serviceAdmin'] },
  'applySaleVersion': { allow: ['user', 'serviceAdmin'] },
  'saleCenterUserProducts': { allow: ['user', 'serviceAdmin'] },
  'meProfile': { allow: ['user', 'serviceAdmin'] },
  '200matchOpenMissionContext': { allow: ['user', 'serviceAdmin'] },
  '201matchCandidateUsers': { allow: ['user', 'serviceAdmin'] },
  '202matchUserContext': { allow: ['user', 'serviceAdmin'] },
  '203matchOpenMissionsForUser': { allow: ['user', 'serviceAdmin'] },
  '204matchOpenMashaabimContext': { allow: ['user', 'serviceAdmin'] },
  '205matchUsersByMashaabim': { allow: ['user', 'serviceAdmin'] },
  '206matchOpenMashaabimsForUser': { allow: ['user', 'serviceAdmin'] },
  '207createMatchSuggestion': { allow: ['user', 'serviceAdmin'] },
  '208updateMatchSuggestion': { allow: ['user', 'serviceAdmin'] },
  '209levMatchSuggestions': { allow: ['user', 'serviceAdmin'] },
  '210findMatchSuggestionsByMission': { allow: ['user', 'serviceAdmin'] },
  '211findMatchSuggestionsByMashaabim': { allow: ['user', 'serviceAdmin'] },
  '212levResourceMatchSuggestions': { allow: ['user', 'serviceAdmin'] },
  '1chatsend': { allow: ['user', 'serviceAdmin'] },
  '2forumCr': { allow: ['user', 'serviceAdmin'] },
  '2forumCrHaluka': { allow: ['user', 'serviceAdmin'] },
  '2forumCrBasic': { allow: ['user', 'serviceAdmin'] },
  '2linkForumToSheirut': { allow: ['user', 'serviceAdmin'] },
  '2linkForumToSheirutpend': { allow: ['user', 'serviceAdmin'] },
  'getPendmChatForum': { allow: ['user', 'serviceAdmin'] },
  'getPmashChatForum': { allow: ['user', 'serviceAdmin'] },
  'linkForumToPendm': { allow: ['user', 'serviceAdmin'] },
  'linkForumToPmash': { allow: ['user', 'serviceAdmin'] },
  'getDecisionChatForum': { allow: ['user', 'serviceAdmin'] },
  'linkForumToDecision': { allow: ['user', 'serviceAdmin'] },
  '2cGetMoneyReceivers': { allow: ['user', 'serviceAdmin'] },
  '2aSetMoneyReceivers': { allow: ['user', 'serviceAdmin'] },
  '3projectJSONQue': { allow: ['user', 'serviceAdmin'] },
  '4crtask': { allow: ['user', 'serviceAdmin'] },
  '5crratson': { allow: ['user', 'serviceAdmin'] },
  '6addTelegram': { allow: ['user', 'serviceAdmin'] },
  '7getTelegramIds': { allow: ['serviceAdmin'] }, // server-only callers
  '8getMissionsOnProgress': { allow: ['user', 'serviceAdmin'] },
  '9startTimer': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '10stopTimer': { allow: ['user', 'serviceAdmin'] },
  '11saveTimer': { allow: ['user', 'serviceAdmin'] },
  '12mission': { allow: ['user', 'serviceAdmin'] },
  '13missionById': { allow: ['serviceAdmin'] }, // server-only callers
  '14changeOnline': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '15createPgishauser': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '16createPgisha': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '17getUsers': { allow: ['user', 'serviceAdmin'] },
  '170getMyCoMembers': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '171findUserByExact': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '18createNewMeeting': { allow: ['user', 'serviceAdmin'] },
  '19CreatePendMeeting': { allow: ['user', 'serviceAdmin'] },
  '20CreateUserMeeting': { allow: ['user', 'serviceAdmin'] },
  '21createMission': { allow: ['user', 'serviceAdmin'] },
  '22setOnline': { allow: ['user', 'serviceAdmin'] },
  '23myUserMeeting': { allow: ['user', 'serviceAdmin'] },
  '24userJSONQue': { allow: ['user', 'serviceAdmin'] },
  '25UserArr1': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '26addUserArr1': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '27getFiniApp': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '27GetOpenMissionsRegTr': { allow: ['user', 'serviceAdmin'] },
  '28GetOpenMissionsReg': { allow: ['user', 'serviceAdmin'] },
  '29GetOpenMissionsNonregTr': { allow: ['user', 'serviceAdmin'] },
  '30GetOpenMissionsNonreg': { allow: ['user', 'serviceAdmin'] },
  '31updateTask': { allow: ['user', 'serviceAdmin'] },
  '32createTimeGrama': { allow: ['user', 'serviceAdmin'] },
  '33CreateTimer': { allow: ['user', 'serviceAdmin'] },
  '34UpdateTimer': { allow: ['user', 'serviceAdmin'] },
  '35updateTimeGrama': { allow: ['user', 'serviceAdmin'] },
  '36getMissionTimer': { allow: ['user', 'serviceAdmin'] },
  '37getUserTimers': { allow: ['user', 'serviceAdmin'] },
  '38getProjectTimers': { allow: ['user', 'serviceAdmin'] },
  '39GetNegotiation': { allow: ['user', 'serviceConsensus'] }, // consensus
  '40CreateNegotiation': { allow: ['user', 'serviceConsensus'] }, // consensus
  '41CreatePosition': { allow: ['user', 'serviceConsensus'] }, // consensus
  '42UpdatePosition': { allow: ['user', 'serviceConsensus'] }, // consensus
  'GetNegotiationByToken': { allow: ['user', 'serviceConsensus'] }, // consensus
  'GetNegotiationBySource': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '43SetNegotiationResolution': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  'GetNegotiationResolutionBySource': { allow: ['user', 'serviceAdmin'] },
  'ListLocalNegotiations': { allow: ['user', 'serviceConsensus'] }, // consensus
  'ListArguments': { allow: ['user', 'serviceConsensus'] }, // consensus
  'CreateArgument': { allow: ['user', 'serviceConsensus'] }, // consensus
  'UpdateArgument': { allow: ['user', 'serviceConsensus'] }, // consensus
  'ListIssues': { allow: ['user', 'serviceConsensus'] }, // consensus
  'ListClauses': { allow: ['user', 'serviceConsensus'] }, // consensus
  'CreateIssue': { allow: ['user', 'serviceConsensus'] }, // consensus
  'CreateClause': { allow: ['user', 'serviceConsensus'] }, // consensus
  'UpdateClause': { allow: ['user', 'serviceConsensus'] }, // consensus
  'ListPlaces': { allow: ['user', 'serviceConsensus'] }, // consensus
  '43updateProfilePic': { allow: ['user', 'serviceAdmin'] },
  '44updateWelcomeCard': { allow: ['user', 'serviceAdmin'] },
  '45deleteMachshir': { allow: ['serviceAdmin'] }, // server-only callers
  '46getMachshirByEndpoint': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '47GetGiftById': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '48GetServiceById': { allow: ['user', 'serviceAdmin'] },
  '49GetProjectById': { allow: ['user', 'serviceAdmin'] },
  '50GetOpenMashaabimById': { allow: ['user', 'serviceAdmin'] },
  '51GetOpenMissionById': { allow: ['user', 'serviceAdmin'] },
  'getOpenMissionExtractedKey': { allow: ['user', 'serviceAdmin'] },
  '52GetUserById': { allow: ['user', 'serviceAdmin'] },
  '61ApproveAct': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '62MarkActDone': { allow: ['user', 'serviceAdmin'] },
  '63SetActStatus': { allow: ['user', 'serviceAdmin'] },
  '64getUserProjectList': { allow: ['user', 'serviceAdmin'] },
  '65checkProjectMembership': { allow: ['user', 'serviceAdmin'] },
  '65checkSheirutpendRequester': { allow: ['user', 'serviceAdmin'] },
  '65checkSheirutCustomer': { allow: ['user', 'serviceAdmin'] },
  '66getProjectsCount': { allow: ['serviceAdmin'] }, // server-only callers
  '205getPlatformProject': { allow: ['user', 'serviceAdmin'] },
  '206createPlatformSale': { allow: ['user', 'serviceAdmin'] },
  '207createSiteShareContribution': { allow: ['user', 'serviceAdmin'] },
  '208updateSiteShareContribution': { allow: ['user', 'serviceAdmin'] },
  '209getSiteShareContributionByUserTosplit': { allow: ['user', 'serviceAdmin'] },
  '210getSiteShareContributionsByTosplit': { allow: ['user', 'serviceAdmin'] },
  '211getOpenSiteShareDecisions': { allow: ['user', 'serviceAdmin'] },
  '212getSiteShareIncomeSheirutByTosplit': { allow: ['user', 'serviceAdmin'] },
  '213updateSheirut': { allow: ['user', 'serviceAdmin'] },
  '214getSiteShareContributionById': { allow: ['user', 'serviceAdmin'] },
  '215getSiteSharePayables': { allow: ['user', 'serviceAdmin'] },
  '216getSiteShareContributionsByGivingProject': { allow: ['user', 'serviceAdmin'] },
  '217getSiteShareContributionsByReciveProject': { allow: ['user', 'serviceAdmin'] },
  '218getRikmaSplitsArchive': { allow: ['user', 'serviceAdmin'] },
  '67getMembersCount': { allow: ['serviceAdmin'] }, // server-only callers
  '279getChezinNames': { allow: ['serviceAdmin'] }, // server-only callers
  '280createChezin': { allow: ['serviceAdmin'] }, // server-only callers
  '281createTikunolam': { allow: ['serviceAdmin'] }, // server-only callers
  '282createTranslate': { allow: ['serviceAdmin'] }, // server-only callers
  '283getSkillsRolesWorkways': { allow: ['user', 'serviceAdmin'] },
  '68updateTosplit': { allow: ['user', 'serviceAdmin'] },
  '71createSheirutpend': { allow: ['user', 'serviceAdmin'] },
  '69createHaluka': { allow: ['user', 'serviceAdmin'] },
  '70updateHaluka': { allow: ['user', 'serviceAdmin'] },
  '70.5createTosplit': { allow: ['user', 'serviceAdmin'] },
  '71updateSaleSplited': { allow: ['user', 'serviceAdmin'] },
  '71.5getHaluka': { allow: ['user', 'serviceAdmin'] },
  '71.6confirmHaluka': { allow: ['user', 'serviceAdmin'] },
  '72createMesimabetahalich': { allow: ['user', 'serviceAdmin'] },
  'getFinnishedMission': { allow: ['user', 'serviceAdmin'] },
  '73archiveOpenMission': { allow: ['user', 'serviceAdmin'] },
  '74addUserToProject': { allow: ['user', 'serviceAdmin'] },
  '75createWelcomeTop': { allow: ['user', 'serviceAdmin'] },
  '76archiveAsk': { allow: ['user', 'serviceAdmin'] },
  '77createMonter': { allow: ['user', 'serviceAdmin'] },
  '78archiveMultipleAsks': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '79approveTosplit': { allow: ['user', 'serviceAdmin'] },
  '72getSheirutpendById': { allow: ['user', 'serviceAdmin'] },
  '80updateSale': { allow: ['user', 'serviceAdmin'] },
  '81updateHaluka': { allow: ['user', 'serviceAdmin'] },
  '124addVoteToTosplit': { allow: ['user', 'serviceAdmin'] },
  '73updateSheirutpend': { allow: ['user', 'serviceAdmin'] },
  '142getPendmForVote': { allow: ['user', 'serviceAdmin'] },
  '143archivePendmWithVotes': { allow: ['user', 'serviceAdmin'] },
  '144getPmashForVote': { allow: ['user', 'serviceAdmin'] },
  '145archivePmashWithVotes': { allow: ['user', 'serviceAdmin'] },
  '146addVoteToPmash': { allow: ['user', 'serviceAdmin'] },
  '147getPendmDiun': { allow: ['user', 'serviceAdmin'] },
  '148getPmashDiun': { allow: ['user', 'serviceAdmin'] },
  '149updatePendmDiun': { allow: ['user', 'serviceAdmin'] },
  '150updatePmashDiun': { allow: ['user', 'serviceAdmin'] },
  '154updateMissionStatus': { allow: ['user', 'serviceAdmin'] },
  '151getMaapForVote': { allow: ['user', 'serviceAdmin'] },
  '152archiveMaapWithVotes': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '153addVoteToMaap': { allow: ['user', 'serviceAdmin'] },
  '155getHalukaForReceive': { allow: ['user', 'serviceAdmin'] },
  '156getHalukaChatre': { allow: ['user', 'serviceAdmin'] },
  '157updateHalukaChatre': { allow: ['user', 'serviceAdmin'] },
  '158updateUserHervachti': { allow: ['user', 'serviceAdmin'] },
  '159getDecisionForVote': { allow: ['user', 'serviceAdmin'] },
  '160archiveDecision': { allow: ['user', 'serviceAdmin'] },
  '161getDecisionDisplayInfo': { allow: ['user', 'serviceAdmin'] },
  '85addVoteToPend': { allow: ['user', 'serviceAdmin'] },
  '86addVoteToSheirutpend': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '53GetPendingMeetings': { allow: ['user', 'serviceAdmin'] },
  '54ApprovePendMeeting': { allow: ['user', 'serviceAdmin'] },
  '55CheckMeetingStatus': { allow: ['user', 'serviceAdmin'] },
  '56SetMeetingSet': { allow: ['user', 'serviceAdmin'] },
  '57StartMeeting': { allow: ['user', 'serviceAdmin'] },
  '58CreateMeetingForum': { allow: ['user', 'serviceAdmin'] },
  '59GetMeetingDetails': { allow: ['user', 'serviceAdmin'] },
  '60EndMeeting': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '61RequestMeetingStart': { allow: ['user', 'serviceAdmin'] },
  '62SetUserReadyForStart': { allow: ['user', 'serviceAdmin'] },
  '63CheckMeetingReadyStatus': { allow: ['user', 'serviceAdmin'] },
  '64ClearPendingStart': { allow: ['user', 'serviceAdmin'] },
  'updateMeetingAvailability': { allow: ['user', 'serviceAdmin'] },
  '65GetAskById': { allow: ['user', 'serviceAdmin'] },
  '66CreateForumForAsk': { allow: ['user', 'serviceAdmin'] },
  '67UpdateAskForum': { allow: ['user', 'serviceAdmin'] },
  '80usersPermissionsUserWithAskeds': { allow: ['user', 'serviceAdmin'] },
  '81updateAskeds': { allow: ['user', 'serviceAdmin'] },
  '81.5createAsk': { allow: ['user', 'serviceAdmin'] },
  '82createTimegramaForAsk': { allow: ['user', 'serviceAdmin'] },
  '128getProjectMembersAndRestime': { allow: ['user', 'serviceAdmin'] },
  'getRolesHolders': { allow: ['user', 'serviceAdmin'] },
  'getProjectPeopleAndRoles': { allow: ['user', 'serviceAdmin'] },
  '125createAskm': { allow: ['user', 'serviceAdmin'] },
  '126updateSpDeclined': { allow: ['user', 'serviceAdmin'] },
  '127createTimegramaForAskm': { allow: ['user', 'serviceAdmin'] },
  '129updateUserDeclined': { allow: ['user', 'serviceAdmin'] },
  '130updateOpenMissionDeclined': { allow: ['user', 'serviceAdmin'] },
  '131archiveOpenMashaabim': { allow: ['user', 'serviceAdmin'] },
  '131bArchiveAskm': { allow: ['user', 'serviceAdmin'] },
  '132archiveAskmWithVotes': { allow: ['user', 'serviceAdmin'] },
  '133addVoteToAskm': { allow: ['user', 'serviceAdmin'] },
  '83levMainUserQuery': { allow: ['user', 'serviceAdmin'] },
  '84levOpenMissionsQuery': { allow: ['user', 'serviceAdmin'] },
  '86addVoteToSheirutpend_v2': { allow: ['user', 'serviceAdmin'] },
  '87createSheirut': { allow: ['user', 'serviceAdmin'] },
  '88GetMissionTimersForRecalc': { allow: ['user', 'serviceAdmin'] },
  '89getUsersCount': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '90myActsQuery': { allow: ['user', 'serviceAdmin'] },
  '91createPartof': { allow: ['user', 'serviceAdmin'] },
  '92updateForumSubject': { allow: ['user', 'serviceAdmin'] },
  '93updateOpenMissionPartofs': { allow: ['user', 'serviceAdmin'] },
  '94updateOpenMashaabimPartofs': { allow: ['user', 'serviceAdmin'] },
  '95updateMesimabetahalichPartofs': { allow: ['user', 'serviceAdmin'] },
  '96updateMaapPartofs': { allow: ['user', 'serviceAdmin'] },
  '97getOpenMissionPartofs': { allow: ['user', 'serviceAdmin'] },
  '98getAskForums': { allow: ['user', 'serviceAdmin'] },
  '99updateAskForums': { allow: ['user', 'serviceAdmin'] },
  '100getMesimabetahalichForums': { allow: ['user', 'serviceAdmin'] },
  '101updateMesimabetahalichForums': { allow: ['user', 'serviceAdmin'] },
  '102projectProcessesQuery': { allow: ['user', 'serviceAdmin'] },
  '102getMesimabetahalichForFinish': { allow: ['user', 'serviceAdmin'] },
  '103createFinnishedMission': { allow: ['user', 'serviceAdmin'] },
  '104createFiniapruval': { allow: ['user', 'serviceAdmin'] },
  '105updateMesimabetahalichForFinish': { allow: ['user', 'serviceAdmin'] },
  '110getMissionForTimerSave': { allow: ['user', 'serviceAdmin'] },
  '111createFiniapruvalForTimer': { allow: ['user', 'serviceAdmin'] },
  '112updateMissionMonthlyHours': { allow: ['user', 'serviceAdmin'] },
  '113createFinnishedMissionForTimerSave': { allow: ['user', 'serviceAdmin'] },
  '114updateFinnishedMissionHours': { allow: ['user', 'serviceAdmin'] },
  '115updateMissionTotalHoursSaved': { allow: ['user', 'serviceAdmin'] },
  '116monthlyReset': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '118updateFiniapruvalVots': { allow: ['user', 'serviceAdmin'] },
  '119createFinnishedMissionFinal': { allow: ['user', 'serviceAdmin'] },
  '117getFiniapruvalForClose': { allow: ['user', 'serviceAdmin'] },
  '120addVoteToAsk': { allow: ['user', 'serviceAdmin'] },
  '121addVoteToDecision': { allow: ['user', 'serviceAdmin'] },
  '122addWeFinnishVote': { allow: ['user', 'serviceAdmin'] },
  '123dealsForUser': { allow: ['user', 'serviceAdmin'] },
  '125userPendingForMatanot': { allow: ['user', 'serviceAdmin'] },
  '124sheirutForDeal': { allow: ['user', 'serviceAdmin'] },
  '125createMatanotRecipeMission': { allow: ['user', 'serviceAdmin'] },
  '126updateMatanotRecipeMission': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '127deleteMatanotRecipeMission': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '128createMatanotRecipeResource': { allow: ['user', 'serviceAdmin'] },
  '129updateMatanotRecipeResource': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '130deleteMatanotRecipeResource': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '131createSheirutFulfillment': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '132updateSheirutFulfillment': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '133queryComplexMatanot': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '134updateMatanotStatus': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  '135approveMatanot': { allow: ['user', 'serviceAdmin'] },
  '136createMatanot': { allow: ['user', 'serviceAdmin'] },
  '137createPendmForRecipe': { allow: ['user', 'serviceAdmin'] },
  '138createPmashForRecipe': { allow: ['user', 'serviceAdmin'] },
  '139createMesimabetahalich': { allow: ['user', 'serviceAdmin'] },
  '140createAct': { allow: ['user', 'serviceAdmin'] },
  '141createMaap': { allow: ['user', 'serviceAdmin'] },
  '105queryRatsonWithProposals': { allow: ['user', 'serviceAdmin'] },
  '106listMyRatsons': { allow: ['user', 'serviceAdmin'] },
  '100updateRatson': { allow: ['user', 'serviceAdmin'] },
  '101createRatsonProposal': { allow: ['user', 'serviceAdmin'] },
  '102updateRatsonProposal': { allow: ['user', 'serviceAdmin'] },
  '107listRatsonsForProject': { allow: ['user', 'serviceAdmin'] },
  '108createRatsonMatchJob': { allow: ['user', 'serviceAdmin'] },
  '110listCandidateMatanots': { allow: ['user', 'serviceAdmin'] },
  '109listOpenRatsons': { allow: ['user', 'serviceAdmin'] },
  '111listMyWishInvitations': { allow: ['user', 'serviceAdmin'] },
  '139createWishMatanot': { allow: ['user', 'serviceAdmin'] },
  '141listMyWeavesDetailed': { allow: ['user', 'serviceAdmin'] },
  '143assignRecipeMissionMember': { allow: ['user', 'serviceAdmin'] },
  '144assignRecipeResourceMember': { allow: ['user', 'serviceAdmin'] },
  '166crWishWeave': { allow: ['user', 'serviceAdmin'] },
  '167hostWishMatanot': { allow: ['user', 'serviceAdmin'] },
  '168wishRecipeForMaterialize': { allow: ['user', 'serviceAdmin'] },
  'baciFormData': { allow: ['user', 'serviceAdmin'] },
  'crVallue': { allow: ['user', 'serviceAdmin'] },
  'crWeaveFull': { allow: ['user', 'serviceAdmin'] },
  '169crWishOpenMission': { allow: ['user', 'serviceAdmin'] },
  '170crWishOpenMashaabim': { allow: ['user', 'serviceAdmin'] },
  '172resolveSkillsByName': { allow: ['user', 'serviceAdmin'] },
  '112commitWishWillingness': { allow: ['user', 'serviceAdmin'] },
  '162getMissionForEdit': { allow: ['user', 'serviceAdmin'] },
  '163createPendm': { allow: ['user', 'serviceAdmin'] },
  '164createOpenMission': { allow: ['user', 'serviceAdmin'] },
  '165createTimegramaForPendm': { allow: ['user', 'serviceAdmin'] },
  '166createWorkWay': { allow: ['user', 'serviceAdmin'] },
  '167getUserHervachti': { allow: ['user', 'serviceAdmin'] },
  'negoCreateNegopendmission': { allow: ['user', 'serviceAdmin'] },
  'negoUpdatePendm': { allow: ['user', 'serviceAdmin'] },
  'negoUpdateOpenMission': { allow: ['user', 'serviceAdmin'] },
  'negoUpdateAskVots': { allow: ['user', 'serviceAdmin'] },
  'negoCreateNegoMash': { allow: ['user', 'serviceAdmin'] },
  'negoUpdatePmash': { allow: ['user', 'serviceAdmin'] },
  'negoCreateNegoMashRound': { allow: ['user', 'serviceAdmin'] },
  'getAskmNegoRounds': { allow: ['user', 'serviceAdmin'] },
  'applyRoundToOpenMashaabim': { allow: ['user', 'serviceAdmin'] },
  'negoCreateNegopendmissionRound': { allow: ['user', 'serviceAdmin'] },
  'getAskNegoRounds': { allow: ['user', 'serviceAdmin'] },
  'applyRoundToOpenMission': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  'getAskmForFinalize': { allow: ['user', 'serviceAdmin'] },
  'archiveAskmSimple': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  'getActiveTimegramaForAsk': { allow: ['user', 'serviceAdmin'] },
  'getActiveTimegramaForAskm': { allow: ['user', 'serviceAdmin'] },
  'getAskProjectRestime': { allow: ['user', 'serviceAdmin'] },
  'getAskmProjectRestime': { allow: ['user', 'serviceAdmin'] },
  'mrCreateMashabetahalich': { allow: ['user', 'serviceAdmin'] },
  'mrUpdateMashabetahalich': { allow: ['user', 'serviceAdmin'] },
  'mrGetMashabetahalich': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  'mrGetRecurringForMonthi': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  'mrCreateCycleMaap': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  'mrGetRikmashForDelivery': { allow: ['user', 'serviceAdmin'] },
  'mrCreateRikmash': { allow: ['user', 'serviceAdmin'] },
  'mrUpdateRikmash': { allow: ['user', 'serviceAdmin'] },
  'mrLinkRikmashToMashabetahalich': { allow: ['user', 'serviceAdmin'] },
  'mrGetPmashRecurringTerms': { allow: ['user', 'serviceAdmin'] },
  'mrUpdateCycleMaap': { allow: ['user', 'serviceAdmin'] },
  'mrCreateCycleTimegrama': { allow: ['user', 'serviceAdmin'] },
  'mrLinkMaapTimegrama': { allow: ['user', 'serviceAdmin'] },
  'mrCreateNego': { allow: ['user', 'serviceAdmin'] },
  'mrGetMashabForum': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  'mrCreateForumMashab': { allow: ['user', 'serviceAdmin'] },
  'mrGetProjectRestime': { allow: ['user', 'serviceAdmin'] },
  'mrSetTimegramaDone': { allow: ['user', 'serviceAdmin'] },
  'mrResetTimegrama': { allow: ['user', 'serviceAdmin'] },
  'getProjectBaseInfo': { allow: ['user', 'serviceAdmin'] },
  'getProjectBaseInfoWithAuth': { allow: ['user', 'serviceAdmin'] },
  'chainExtraData': { allow: ['user', 'serviceAdmin'] },
  'chainDetailProjectData': { allow: ['user', 'serviceAdmin'] },
  'processLifecycleData': { allow: ['user', 'serviceAdmin'] },
  'getProjectMissions': { allow: ['user', 'serviceAdmin'] },
  'getMissionTemplates': { allow: ['user', 'serviceAdmin'] },
  'getProjectFinancials': { allow: ['user', 'serviceAdmin'] },
  'getProjectValueSummary': { allow: ['user', 'serviceAdmin'] }, // mission-equity preview; serviceAdmin path serves the public availableMission page
  'getProjectProcesses': { allow: ['serviceAdmin'] }, // unreferenced in codebase (2026-07-18) — tightened to serviceAdmin-only
  'getProjectVotes': { allow: ['user', 'serviceAdmin'] },
  'getOpenVoteCounts': { allow: ['user', 'serviceAdmin'] },
  'getOpenWishCounts': { allow: ['user', 'serviceAdmin'] },
  'getPendmForVote': { allow: ['user', 'serviceAdmin'] },
  'getPmashForVote': { allow: ['user', 'serviceAdmin'] },
  'getAskForVote': { allow: ['user', 'serviceAdmin'] },
  'getAskmForVote': { allow: ['user', 'serviceAdmin'] },
  'getTosplitForVote': { allow: ['user', 'serviceAdmin'] },
  'getMissionInProgress': { allow: ['user', 'serviceAdmin'] },
  'getVote': { allow: ['user', 'serviceAdmin'] },
  'getAct': { allow: ['user', 'serviceAdmin'] },
  'getAllVallues': { allow: ['user', 'serviceAdmin'] },
  'updateProjectDetails': { allow: ['user', 'serviceAdmin'] },
  'createProjectDecision': { allow: ['user', 'serviceAdmin'] },
  '103getForumThreadById': { allow: ['user', 'serviceAdmin'] },
  '105getForumSummaryById': { allow: ['user', 'serviceAdmin'] },
  '104getUserForumSources': { allow: ['user', 'serviceAdmin'] },
  'getMashaabims': { allow: ['user', 'serviceAdmin'] },
  'getUserSpByMashaabim': { allow: ['user', 'serviceAdmin'] },

  // ─── Manually classified (added after the script's last run — see
  //     docs/PLAN_API_PERMISSIONS.md §2 "נשאר לביקורת ידנית") ──────────

  // hub/+page.server.ts: svc = !uid — same public/registered split as the
  // qids below; aggregate counts only, nothing per-user or sensitive.
  '279demandCounts': { allow: ['user', 'serviceAdmin'] },
  '280maagadDemandCounts': { allow: ['user', 'serviceAdmin'] },

  // (regandnon)/project + (regandnon)/gift index pages: public discovery
  // directories, same svc = !uid split as the map qids; the loads reduce
  // relation slices to aggregate counts before returning data.
  '281discoverProjects': { allow: ['user', 'serviceAdmin'] },
  '282discoverProducts': { allow: ['user', 'serviceAdmin'] },
  '283discoverMissions': { allow: ['user', 'serviceAdmin'] },
  '284discoverResources': { allow: ['user', 'serviceAdmin'] },

  // matching/engine.ts: always run through StrapiClient with the admin
  // token, never with a user JWT — writes suggestion data for *other* users.
  '213recentSuggestionEmailCounts': { allow: ['serviceAdmin'] },

  // Self-nomination action configs (nominateSelfMission/Resource.ts,
  // dismissSelfNomination.ts) — executed via strapi.execute(..., context.jwt),
  // i.e. with the calling user's own token, same trust boundary as a direct
  // /api/send call from that user.
  '214createSelfNomOpenMission': { allow: ['user', 'serviceAdmin'] },
  '215createSelfNomOpenMashaabim': { allow: ['user', 'serviceAdmin'] },
  '216getSelfNomMissionContext': { allow: ['user', 'serviceAdmin'] },
  '217getSelfNomMashaabimContext': { allow: ['user', 'serviceAdmin'] },
  '218createSelfNomSp': { allow: ['user', 'serviceAdmin'] },

  // project/[id]/support/+page.server.js: public rikma homepage, deliberately
  // readable without a login (isSer = tok === false); the handler strips raw
  // money rows before they reach the client, so exposure to serviceAdmin here
  // is safe.
  '213publicSupportPage': { allow: ['user', 'serviceAdmin'] },

  // availableMission/[id] & availiableResorce/[id] +page.server.js: same
  // public/registered split (isSer = tok === false).
  'getOpenMissionMaagad': { allow: ['user', 'serviceAdmin'] },
  'getOpenMashaabimMaagad': { allow: ['user', 'serviceAdmin'] },

  // api/v1/sales/+server.ts (External Sales API): looked up with ADMIN_TOKEN
  // directly via strapiClient.execute, bypassing /api/send entirely — never
  // reachable with a user JWT or a plain apiKey principal.
  'salesApiProductInfo': { allow: ['serviceAdmin'] },
  'saleByExternalId': { allow: ['serviceAdmin'] },
};

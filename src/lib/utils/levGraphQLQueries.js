/**
 * @typedef {import('$lib/types/strapiTypes').StrapiResponse} StrapiResponse
 * @typedef {import('$lib/types/strapiTypes').StrapiEntity} StrapiEntity
 * @typedef {import('$lib/types/strapiTypes').StrapiCollection} StrapiCollection
 */

import { goto } from '$app/navigation';

// GraphQL query builders for lev page

/**
 * Build the main user GraphQL query for the lev page.
 * This query fetches comprehensive user data including projects, missions, asks, and more.
 * 
 * @param {string | number} idL - The user ID to query
 * @param {string} lang - Language code ('he' or 'en') for localized fields
 * @returns {string} The GraphQL query string
 * 
 * @example
 * const query = buildMainUserQuery('123', 'he');
 * // Returns a GraphQL query string for user 123 with Hebrew localizations
 */
export function buildMainUserQuery(idL, lang) {
  return `{ usersPermissionsUser (id: ${idL}){
    data {
      id attributes{ 
      haskama
      asks (filters: { archived: { eq: false } }){ data{ id attributes{
            archived
            project{data{id attributes{projectName profilePic {data{attributes{ url formats }}} }}} 
            vots{what  zman users_permissions_user{data{id}}}
            timegrama {data{id attributes{date}}}
            createdAt
            open_mission {data{id attributes{  
                  name isRishon
                }}}            
            chat{why ide what zman id users_permissions_user {data{id attributes{username profilePic {data{attributes {url formats }}}}}} }
        }}}
      askms (filters: { archived: { eq: false } }){ data{ id attributes{
                    vots  {what why zman id users_permissions_user {data{id}}}
                    timegrama {data{id attributes{date}}}
                    open_mashaabim { data {id attributes{  price descrip spnot kindOf  sqadualedf sqadualed linkto createdAt hm name easy }}}
                    project {data {id attributes{ projectName user_1s {data{id}} profilePic {data{ attributes{url formats }}}}}}
                    users_permissions_user{data {id attributes {haskama username profilePic {data{attributes{url formats }}}}}}
                      }}}
      sps {data{id attributes{ name unit price myp 
                		mashaabim {data{id attributes{ price 
                              open_mashaabims (filters: { archived: { eq: false } }){ data{ id attributes{
                                        declinedsps {data{ id }} price hm descrip spnot kindOf users {data{ id }} 
                                        sqadualedf sqadualed linkto createdAt hm name easy
                												project {data{id attributes {projectName  user_1s {data{id}} profilePic {data{attributes{url formats}}}}}} 
                     }}}}}}}}} 
      mesimabetahaliches (filters: { forappruval: { eq: false },finnished:{ eq: false } }) {data{ id attributes{ 
        						status stname timer hearotMeyuchadot name descrip hoursassinged perhour privatlinks publicklinks iskvua howmanyhoursalready  admaticedai dates
        						mission {data{id}}
        						project{data{id}}
                                acts{data{id attributes{shem myIshur link hashivut valiIshur des dateF dateS status naasa}}}
            			   }}}
      welcom_tops (filters: { clicked: { eq: false } }){ data{ id attributes{
                	 project{data{id attributes{descripFor publicDescription}}}
   								   }}}
      skills{data{id attributes{ 
            			 open_missions(filters: { archived: { eq: false } }){ data{ id attributes{
                								 skills {data{ id}} 
                   							 tafkidims {data {id}}  
                    						 work_ways {data{ id}} 
                                }}}
      								}}}
	  username hervachti
      profilePic {data{attributes {url formats }}}  
      askeds  {data{ id }}
      declined {data{ id }}
      work_ways {data{ id }} 
      tafkidims {data{ id attributes{
                        open_missions(filters: { archived: { eq: false } }){ data{ id attributes{
                								 skills {data{ id }} 
                   							 tafkidims {data {id}}  
                    						 work_ways {data{ id }}
                                }}}}
     									 }}

  	projects_1s {data{id attributes{ projectName restime
    			user_1s {data{id attributes{username haskamaz haskamac email noMail haskama profilePic {data{attributes{ url formats }}}}}} 
    			profilePic {data{attributes{ url formats }}} 
          sheirutpends(filters:{ archived: { eq: false } }){data{id attributes{
            sheirut{data{id attributes{name descrip equaliSplited oneTime}}}
            createdAt
            vots {what id order zman ide users_permissions_user {data{id}}}
            timegrama{data{id attributes{date}}}
          }}}
    			decisions (filters: { archived: { eq: false } }){ data{ id attributes{ 
        					kind createdAt 
                  timegrama{data{id attributes{date}}}
        					newpic {data{id attributes{ url formats }}}
        					vots  {what why id order users_permissions_user {data{id}}}
      							}}}
    			tosplits (filters: { finished: { eq: false } }){ data{ id attributes{ 
        					name 
                            halukas {data {id}}
        					vots  {what why id users_permissions_user {data {id}}}
                            hervachti {amount noten mekabel users_permissions_user {data {id attributes{hervachti}}}}
      							}}}
                halukas (filters: {and:[{ ushar: { eq: true } } { confirmed: { eq: false }}]}){ data{ id attributes{ 
                    amount senderconf forum{data{id}} chatre {freetext send {data{id}} when seen} usersend {data {id}} userrecive {data{id}}  tosplit{data{id attributes{halukas{data{id attributes{confirmed}}} hervachti{nirsham amount noten mekabel users_permissions_user{data{id attributes{hervachti}}}}}}}
                }}} 
    			maaps(filters: { archived: { eq: false } }){ data{ id attributes{ 
        					createdAt name  
        					sp{data {id attributes{ name myp unit 
                		            users_permissions_user {data {id attributes{ username profilePic {data{attributes {url formats } }}}}}}}}
                		    open_mashaabim{data{id attributes{ name sqadualed sqadualedf kindOf spnot easy}}}
                            vots {what why id users_permissions_user {data { id}}}
                                }}}
    			pmashes (filters: { archived: { eq: false } }){ data{ id attributes{ 
        					hm sqadualedf sqadualed linkto createdAt name descrip easy price kindOf spnot 
        					nego_mashes{data{id attributes{
                                hm sqadualedf sqadualed linkto createdAt name descrip easy price kindOf spnot users_permissions_user {data { id}}
                            }}}
                            mashaabim {data{id}} 
                            timegrama {data{id attributes{date}}}
        					diun {what why order id zman users_permissions_user {data {id }}}
        					users { what order why id users_permissions_user {data{id }}}
      							}}}
    			open_mashaabims {data{ id attributes{ name 
                	        project {data{ id }} 
                	        mashaabim {data{attributes{ sps{data{id attributes {name price kindOf spnot  myp 
                												users_permissions_user {data{id attributes{ username profilePic {data{attributes{url formats }}}}}}
                    }}}}}}}}}  
          askwants(filters:{archived:{eq:false}}){
            data{
              id attributes{
                timegrama{
                  data{id}
                }
                vots{what why order ide zman users_permissions_user{
                  data{
                    id
                  }
                }}
                users_permissions_user{
                  data{
                    id
                  }
                }
                sheirut{
                  data{
                    id
                  }
                }
              }
            }
          }          
    			askms(filters: { archived: { eq: false } }){ data{ id attributes{
                            vots {what zman why id users_permissions_user {data{id}}}
                            timegrama {data{id attributes{date}}}
                            createdAt                            
                            chat{why ide what zman id users_permissions_user {data{id }} }
                            users_permissions_user {data{id attributes{ username  profilePic{data{attributes {url formats }}}}}}
                        	open_mashaabim {data{ id attributes{  price descrip spnot kindOf  sqadualedf sqadualed linkto createdAt hm name easy }}}
                          	sp {data{ id attributes{ price myp }}}
      											}}}
   				asks(filters: { archived: { eq: false } }){ data{ id attributes{
                            vots  {what why zman order id users_permissions_user {data{id}}}
                            timegrama {data{id attributes{date}}}
                            createdAt
                            chat{why id ide what zman users_permissions_user {data{id}}}
                            open_mission {data{id attributes{
                            acts{data{id attributes{shem  link  des dateF dateS  }}}
                              mission {data{id}}
                               negopendmissions{data{id attributes{
                                name hearotMeyuchadot descrip createdAt noofhours perhour isOriginal date dates isMonth 
                                users_permissions_user{data{id attributes{username}}}
                                skills {data{ id attributes{ skillName ${
                                  lang == 'he'
                                    ? 'localizations {data{attributes{skillName }}}'
                                    : ''
                                }}}}
                                tafkidims {data{id attributes{ roleDescription ${
                                  lang == 'he'
                                    ? 'localizations {data{attributes {roleDescription }}}'
                                    : ''
                                }}}}
                                work_ways {data{id attributes{ workWayName ${
                                  lang == 'he'
                                    ? 'localizations{data{attributes{workWayName }}}'
                                    : ''
                                }}}}
                              acts{data{id attributes{shem  link  des dateF dateS  }}}

                            }}}
                                    declined {data{ id}} iskvua isRishon sqadualed dates publicklinks 
                                           skills{data{id attributes{skillName localizations {data{attributes{skillName }}}}}} 
                             work_ways {data{ id attributes{ workWayName ${
                                  lang === 'he'
                                    ? 'localizations{data{attributes{workWayName }}}'
                                    : ''
                                }}}}  
                             tafkidims{data{id attributes{roleDescription localizations{data{attributes{roleDescription }}}}}}  
                                            noofhours perhour privatlinks descrip hearotMeyuchadot name}}}
                            project {data{ id }}
                            users_permissions_user {data{ id attributes{ username 
                             skills{data{id attributes{skillName localizations {data{attributes{skillName }}}}}} 
                             work_ways {data{ id attributes{ workWayName ${
                                  lang === 'he'
                                    ? 'localizations{data{attributes{workWayName }}}'
                                    : ''
                                }}}}  
                             tafkidims{data{id attributes{roleDescription localizations{data{attributes{roleDescription }}}}}}   email profilePic {data{attributes{ url formats }}}}}}
      									}}}
    			finiapruvals(filters: { archived: { eq: false } }){ data{ id attributes{
                        timegrama {data{id attributes{date}}}
              			    missname noofhours why what{data{id attributes {url formats}}} 
        					mesimabetahalich {data{id attributes{ perhour hearotMeyuchadot descrip mission {data {id}}}}}
                            vots  {what why id users_permissions_user {data{id}}}
          					project {data{ id}} 
            				users_permissions_user {data{ id} }
      											}}}
    			pendms(filters: { archived: { eq: false } }){ data{ id attributes{ 
        					name createdAt iskvua hearotMeyuchadot descrip noofhours perhour sqadualed privatlinks publicklinks dates
                            rishon {data{id}}
                            acts{data{id attributes{shem  link  des dateF dateS  }}}
                            negopendmissions{data{id attributes{
                                name hearotMeyuchadot descrip createdAt noofhours perhour isOriginal date dates isMonth 
                                users_permissions_user{data{id attributes{username}}}
                                skills {data{ id attributes{ skillName ${
                                  lang == 'he'
                                    ? 'localizations {data{attributes{skillName }}}'
                                    : ''
                                }}}}
                                tafkidims {data{id attributes{ roleDescription ${
                                  lang == 'he'
                                    ? 'localizations {data{attributes {roleDescription }}}'
                                    : ''
                                }}}}
                                work_ways {data{id attributes{ workWayName ${
                                  lang == 'he'
                                    ? 'localizations{data{attributes{workWayName }}}'
                                    : ''
                                }}}}
                             acts{data{id attributes{shem  link  des dateF dateS  }}}
                            }}}
                            skills {data{ id attributes{ skillName ${
                              lang == 'he'
                                ? 'localizations {data{attributes{skillName }}}'
                                : ''
                            }}}}
                            tafkidims {data{id attributes{ roleDescription ${
                              lang == 'he'
                                ? 'localizations {data{attributes {roleDescription }}}'
                                : ''
                            }}}}
                            work_ways {data{id attributes{ workWayName ${
                              lang == 'he'
                                ? 'localizations{data{attributes{workWayName }}}'
                                : ''
                            }}}}
                            mission {data{ id}}
                            vallues {data{ id}}
                            timegrama{data{id attributes{date}}}
                            diun {what why id zman order users_permissions_user {data{ id}}}  
                            users { what order why zman id users_permissions_user {data{id }}}                                   
      													}}}
    			open_missions(filters: { archived: { eq: false } }){ data{ id attributes{ 
        					declined {data{ id}} 
        					users  {data{id} } 
      								}}}
    }}}
      }}}
}`;
}

/**
 * Build the open missions GraphQL query.
 * Fetches detailed information about specific open missions by their IDs.
 * 
 * @param {Array<string | number>} keysSorted - Array of mission IDs to query
 * @param {string} lang - Language code ('he' or 'en') for localized fields
 * @returns {string} The GraphQL query string
 * 
 * @example
 * const query = buildOpenMissionsQuery([1, 2, 3], 'en');
 * // Returns a GraphQL query for missions with IDs 1, 2, and 3
 */
export function buildOpenMissionsQuery(keysSorted, lang) {
  return `{openMissions (filters: {id:{in: [${keysSorted}]}}){data{ id attributes{
            project {data{ id attributes{ projectName restime timeToP user_1s {data{id }} profilePic{data{attributes {url formats }}}}}}
            sqadualed
            acts{data{id attributes{
              shem des
            }}}
            tafkidims{data {attributes {roleDescription ${
              lang == 'he'
                ? 'localizations {data{attributes {roleDescription }}}'
                : ''
            }}}}
            skills {data{attributes{skillName ${
              lang == 'he'
                ? 'localizations {data{attributes{skillName }}}'
                : ''
            }}}}
            descrip
            hearotMeyuchadot
            name dates
            work_ways {data{attributes{workWayName ${
              lang == 'he'
                ? 'localizations{data{attributes{workWayName }}}'
                : ''
            }}}}
            noofhours perhour
            }
            }
                }}`;
}

/**
 * Fetch main user data from the Strapi GraphQL API.
 * This function retrieves comprehensive user information including projects, missions, and related data.
 * 
 * @param {string} baseUrl - The base URL of the Strapi API (e.g., 'https://api.example.com')
 * @param {string} token - JWT authentication token
 * @param {string | number} idL - The user ID to fetch data for
 * @param {string} lang - Language code ('he' or 'en') for localized content
 * @returns {Promise<StrapiResponse<{ usersPermissionsUser: StrapiEntity<any> }>>} The GraphQL response with user data
 * 
 * @throws {Error} If the HTTP request fails or returns a non-OK status
 * 
 * @example
 * const userData = await fetchMainUserData(
 *   'https://api.example.com',
 *   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 *   '123',
 *   'he'
 * );
 * // Access user data: userData.data.usersPermissionsUser.data.attributes
 */
export async function fetchMainUserData(baseUrl, token, idL, lang) {
  console.log('fetchMainUserData called with:', { baseUrl, tokenLength: token?.length, idL, lang });
  
  /** @type {string} */
  let bearer1 = 'bearer' + ' ' + token;
  
  /** @type {string} */
  let link = baseUrl + '/graphql';
  
  console.log('Making GraphQL request to:', link);
  
  try {
    const response = await fetch(link, {
      method: 'POST',
      headers: {
        Authorization: bearer1,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: buildMainUserQuery(idL, lang)
      })
    });
    
    console.log('GraphQL response status:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('GraphQL response received:', result?.data ? 'Has data' : 'No data', result?.errors ? 'Has errors' : 'No errors');
    
    return result;
  } catch (error) {
    console.error('Error in fetchMainUserData:', error);
    if( error?.message.includes('Unauthorized')) {
    goto('/login?from=lev');
    }
    throw error;
  }
}

/**
 * Fetch open missions data from the Strapi GraphQL API.
 * Retrieves detailed information about specific missions by their IDs.
 * 
 * @param {string} baseUrl - The base URL of the Strapi API
 * @param {string} token - JWT authentication token
 * @param {Array<string | number>} keysSorted - Array of mission IDs to fetch
 * @param {string} lang - Language code ('he' or 'en') for localized content
 * @returns {Promise<StrapiResponse<{ openMissions: StrapiCollection<any> }>>} The GraphQL response with missions data
 * 
 * @example
 * const missions = await fetchOpenMissions(
 *   'https://api.example.com',
 *   'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 *   [1, 2, 3],
 *   'en'
 * );
 * // Access missions: missions.data.openMissions.data
 */
export async function fetchOpenMissions(baseUrl, token, keysSorted, lang) {
  /** @type {string} */
  let bearer1 = 'bearer' + ' ' + token;
  
  /** @type {string} */
  let link = baseUrl + '/graphql';
  
  const response = await fetch(link, {
    method: 'POST',
    headers: {
      Authorization: bearer1,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: buildOpenMissionsQuery(keysSorted, lang)
    })
  });
  
  return response.json();
}
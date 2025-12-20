/**
 * Unit tests for data extraction functions
 * These tests verify that extraction functions correctly transform GraphQL data
 */

import { describe, it, expect } from 'vitest';
import {
  extractPends,
  extractMtaha,
  extractFiapp,
  extractAsked,
  extractSuggestions,
  extractProjects,
  extractPmashes,
  extractWegets,
  extractHalukas,
  extractWelcome,
  extractTransfers,
  extractDecisions
} from './levDataExtractors';

describe('levDataExtractors', () => {
  describe('extractPends', () => {
    it('should return empty array when userData is null', () => {
      const result = extractPends(null);
      expect(result).toEqual([]);
    });

    it('should return empty array when projects_1s is missing', () => {
      const userData = { attributes: {} };
      const result = extractPends(userData);
      expect(result).toEqual([]);
    });

    it('should extract pends from projects', () => {
      const userData = {
        attributes: {
          projects_1s: {
            data: [
              {
                id: 'project1',
                attributes: {
                  pendms: {
                    data: [
                      {
                        id: 'pend1',
                        attributes: {
                          name: 'Test Pend',
                          users: [
                            {
                              users_permissions_user: { data: { id: 'user1' } },
                              what: true,
                              order: 1
                            }
                          ],
                          diun: [],
                          createdAt: '2024-01-01'
                        }
                      }
                    ]
                  }
                }
              }
            ]
          }
        }
      };

      const result = extractPends(userData);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('pend1');
      expect(result[0].projectId).toBe('project1');
      expect(result[0].name).toBe('Test Pend');
      expect(result[0].users).toHaveLength(1);
      expect(result[0].priority).toBe(2); // 1 + 1 user
    });

    it('should handle missing optional fields', () => {
      const userData = {
        attributes: {
          projects_1s: {
            data: [
              {
                id: 'project1',
                attributes: {
                  pendms: {
                    data: [
                      {
                        id: 'pend1',
                        attributes: {
                          name: 'Test Pend'
                        }
                      }
                    ]
                  }
                }
              }
            ]
          }
        }
      };

      const result = extractPends(userData);
      expect(result).toHaveLength(1);
      expect(result[0].users).toEqual([]);
      expect(result[0].messages).toEqual([]);
      expect(result[0].priority).toBe(1);
    });
  });

  describe('extractMtaha', () => {
    it('should return empty array when userData is null', () => {
      const result = extractMtaha(null);
      expect(result).toEqual([]);
    });

    it('should return empty array when mesimabetahaliches is missing', () => {
      const userData = { attributes: {} };
      const result = extractMtaha(userData);
      expect(result).toEqual([]);
    });

    it('should extract missions in progress', () => {
      const userData = {
        attributes: {
          mesimabetahaliches: {
            data: [
              {
                id: 'mtaha1',
                attributes: {
                  name: 'Test Mission',
                  status: 'in_progress',
                  project: { data: { id: 'project1' } },
                  howmanyhoursalready: 5
                }
              }
            ]
          }
        }
      };

      const result = extractMtaha(userData);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('mtaha1');
      expect(result[0].projectId).toBe('project1');
      expect(result[0].name).toBe('Test Mission');
      expect(result[0].progress).toBe(5);
      expect(result[0].priority).toBe(150);
    });
  });

  describe('extractFiapp', () => {
    it('should return empty array when userData is null', () => {
      const result = extractFiapp(null);
      expect(result).toEqual([]);
    });

    it('should extract approval requests from projects', () => {
      const userData = {
        attributes: {
          projects_1s: {
            data: [
              {
                id: 'project1',
                attributes: {
                  finiapruvals: {
                    data: [
                      {
                        id: 'fiapp1',
                        attributes: {
                          missname: 'Test Approval',
                          noofhours: 10,
                          vots: []
                        }
                      }
                    ]
                  }
                }
              }
            ]
          }
        }
      };

      const result = extractFiapp(userData);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('fiapp1');
      expect(result[0].projectId).toBe('project1');
      expect(result[0].type).toBe('approval');
      expect(result[0].priority).toBe(2);
    });
  });

  describe('extractAsked', () => {
    it('should return empty array when userData is null', () => {
      const result = extractAsked(null);
      expect(result).toEqual([]);
    });

    it('should extract ask requests from projects', () => {
      const userData = {
        attributes: {
          projects_1s: {
            data: [
              {
                id: 'project1',
                attributes: {
                  asks: {
                    data: [
                      {
                        id: 'ask1',
                        attributes: {
                          createdAt: '2024-01-01',
                          users_permissions_user: { data: { id: 'user1' } },
                          vots: [],
                          chat: []
                        }
                      }
                    ]
                  }
                }
              }
            ]
          }
        }
      };

      const result = extractAsked(userData);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('ask1');
      expect(result[0].projectId).toBe('project1');
      expect(result[0].userId).toBe('user1');
      expect(result[0].priority).toBe(3);
    });
  });

  describe('extractSuggestions', () => {
    it('should return empty array when userData is null', () => {
      const result = extractSuggestions(null);
      expect(result).toEqual([]);
    });

    it('should extract suggestions from skills', () => {
      const userData = {
        attributes: {
          skills: {
            data: [
              {
                id: 'skill1',
                attributes: {
                  open_missions: {
                    data: [
                      {
                        id: 'mission1',
                        attributes: {
                          skills: { data: [] },
                          tafkidims: { data: [] },
                          work_ways: { data: [] }
                        }
                      }
                    ]
                  }
                }
              }
            ]
          }
        }
      };

      const result = extractSuggestions(userData);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('mission1');
      expect(result[0].type).toBe('skill');
      expect(result[0].sourceId).toBe('skill1');
      expect(result[0].priority).toBe(4);
    });

    it('should extract suggestions from tafkidims', () => {
      const userData = {
        attributes: {
          tafkidims: {
            data: [
              {
                id: 'tafkid1',
                attributes: {
                  open_missions: {
                    data: [
                      {
                        id: 'mission2',
                        attributes: {
                          skills: { data: [] },
                          tafkidims: { data: [] },
                          work_ways: { data: [] }
                        }
                      }
                    ]
                  }
                }
              }
            ]
          }
        }
      };

      const result = extractSuggestions(userData);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('mission2');
      expect(result[0].type).toBe('tafkid');
      expect(result[0].sourceId).toBe('tafkid1');
      expect(result[0].priority).toBe(4);
    });

    it('should deduplicate missions from multiple sources', () => {
      const userData = {
        attributes: {
          skills: {
            data: [
              {
                id: 'skill1',
                attributes: {
                  open_missions: {
                    data: [
                      {
                        id: 'mission1',
                        attributes: {
                          skills: { data: [] },
                          tafkidims: { data: [] },
                          work_ways: { data: [] }
                        }
                      }
                    ]
                  }
                }
              }
            ]
          },
          tafkidims: {
            data: [
              {
                id: 'tafkid1',
                attributes: {
                  open_missions: {
                    data: [
                      {
                        id: 'mission1', // Same mission ID
                        attributes: {
                          skills: { data: [] },
                          tafkidims: { data: [] },
                          work_ways: { data: [] }
                        }
                      }
                    ]
                  }
                }
              }
            ]
          }
        }
      };

      const result = extractSuggestions(userData);
      expect(result).toHaveLength(1); // Should only have one entry
      expect(result[0].id).toBe('mission1');
      expect(result[0].type).toBe('skill'); // First one wins
    });
  });

  describe('extractProjects', () => {
    it('should return empty array when userData is null', () => {
      const result = extractProjects(null);
      expect(result).toEqual([]);
    });

    it('should extract projects', () => {
      const userData = {
        attributes: {
          projects_1s: {
            data: [
              {
                id: 'project1',
                attributes: {
                  projectName: 'Test Project',
                  restime: 100,
                  profilePic: {
                    data: {
                      attributes: {
                        url: '/test.jpg'
                      }
                    }
                  },
                  user_1s: {
                    data: [{ id: 'user1' }, { id: 'user2' }]
                  }
                }
              }
            ]
          }
        }
      };

      const result = extractProjects(userData);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('project1');
      expect(result[0].attributes.projectName).toBe('Test Project');
    });
  });
});

  describe('extractPmashes', () => {
    it('should return empty array when userData is null', () => {
      const result = extractPmashes(null);
      expect(result).toEqual([]);
    });

    it('should return empty array when projects_1s is missing', () => {
      const userData = { attributes: {} };
      const result = extractPmashes(userData);
      expect(result).toEqual([]);
    });

    it('should extract pmashes from projects', () => {
      const userData = {
        attributes: {
          projects_1s: {
            data: [
              {
                id: 'project1',
                attributes: {
                  pmashes: {
                    data: [
                      {
                        id: 'pmash1',
                        attributes: {
                          name: 'Test Resource',
                          kindOf: 'material',
                          price: 100,
                          hm: 5,
                          createdAt: '2024-01-01',
                          users: [],
                          diun: []
                        }
                      }
                    ]
                  }
                }
              }
            ]
          }
        }
      };

      const result = extractPmashes(userData);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('pmash1');
      expect(result[0].projectId).toBe('project1');
      expect(result[0].resourceType).toBe('material');
      expect(result[0].priority).toBe(5);
      expect(result[0].name).toBe('Test Resource');
      expect(result[0].price).toBe(100);
    });
  });

  describe('extractWegets', () => {
    it('should return empty array when userData is null', () => {
      const result = extractWegets(null);
      expect(result).toEqual([]);
    });

    it('should extract maaps from projects', () => {
      const userData = {
        attributes: {
          projects_1s: {
            data: [
              {
                id: 'project1',
                attributes: {
                  maaps: {
                    data: [
                      {
                        id: 'maap1',
                        attributes: {
                          name: 'Test Maap',
                          createdAt: '2024-01-01',
                          vots: []
                        }
                      }
                    ]
                  }
                }
              }
            ]
          }
        }
      };

      const result = extractWegets(userData);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('maap1');
      expect(result[0].projectId).toBe('project1');
      expect(result[0].requestType).toBe('maap');
      expect(result[0].priority).toBe(6);
    });

    it('should extract askms from projects', () => {
      const userData = {
        attributes: {
          projects_1s: {
            data: [
              {
                id: 'project1',
                attributes: {
                  askms: {
                    data: [
                      {
                        id: 'askm1',
                        attributes: {
                          createdAt: '2024-01-01',
                          vots: [],
                          chat: [],
                          users_permissions_user: { data: { id: 'user1' } }
                        }
                      }
                    ]
                  }
                }
              }
            ]
          }
        }
      };

      const result = extractWegets(userData);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('askm1');
      expect(result[0].projectId).toBe('project1');
      expect(result[0].requestType).toBe('askm');
      expect(result[0].priority).toBe(6);
    });
  });

  describe('extractHalukas', () => {
    it('should return empty array when userData is null', () => {
      const result = extractHalukas(null);
      expect(result).toEqual([]);
    });

    it('should extract halukas from projects', () => {
      const userData = {
        attributes: {
          projects_1s: {
            data: [
              {
                id: 'project1',
                attributes: {
                  halukas: {
                    data: [
                      {
                        id: 'haluka1',
                        attributes: {
                          amount: 500,
                          ushar: true,
                          confirmed: false,
                          usersend: { data: { id: 'user1' } },
                          userrecive: { data: { id: 'user2' } }
                        }
                      }
                    ]
                  }
                }
              }
            ]
          }
        }
      };

      const result = extractHalukas(userData);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('haluka1');
      expect(result[0].projectId).toBe('project1');
      expect(result[0].amount).toBe(500);
      expect(result[0].priority).toBe(7);
    });
  });

  describe('extractWelcome', () => {
    it('should return empty array when userData is null', () => {
      const result = extractWelcome(null);
      expect(result).toEqual([]);
    });

    it('should extract welcome messages', () => {
      const userData = {
        attributes: {
          welcom_tops: {
            data: [
              {
                id: 'welcome1',
                attributes: {
                  clicked: false,
                  project: {
                    data: {
                      id: 'project1',
                      attributes: {
                        descripFor: 'Welcome to our project!',
                        publicDescription: 'Public description'
                      }
                    }
                  }
                }
              }
            ]
          }
        }
      };

      const result = extractWelcome(userData);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('welcome1');
      expect(result[0].projectId).toBe('project1');
      expect(result[0].message).toBe('Welcome to our project!');
      expect(result[0].priority).toBe(8);
    });
  });

  describe('extractTransfers', () => {
    it('should return empty array when userData is null', () => {
      const result = extractTransfers(null);
      expect(result).toEqual([]);
    });

    it('should extract transfers from tosplits', () => {
      const userData = {
        attributes: {
          projects_1s: {
            data: [
              {
                id: 'project1',
                attributes: {
                  tosplits: {
                    data: [
                      {
                        id: 'tosplit1',
                        attributes: {
                          name: 'Test Split',
                          vots: [],
                          hervachti: [
                            {
                              amount: 250,
                              noten: true,
                              mekabel: false,
                              users_permissions_user: {
                                data: {
                                  id: 'user1',
                                  attributes: { hervachti: 1000 }
                                }
                              }
                            }
                          ]
                        }
                      }
                    ]
                  }
                }
              }
            ]
          }
        }
      };

      const result = extractTransfers(userData);
      expect(result).toHaveLength(1);
      expect(result[0].projectId).toBe('project1');
      expect(result[0].amount).toBe(250);
      expect(result[0].priority).toBe(9);
      expect(result[0].tosplitName).toBe('Test Split');
    });
  });

  describe('extractDecisions', () => {
    it('should return empty array when userData is null', () => {
      const result = extractDecisions(null);
      expect(result).toEqual([]);
    });

    it('should extract decisions from projects', () => {
      const userData = {
        attributes: {
          projects_1s: {
            data: [
              {
                id: 'project1',
                attributes: {
                  decisions: {
                    data: [
                      {
                        id: 'decision1',
                        attributes: {
                          kind: 'budget_approval',
                          createdAt: '2024-01-01',
                          vots: []
                        }
                      }
                    ]
                  }
                }
              }
            ]
          }
        }
      };

      const result = extractDecisions(userData);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('decision1');
      expect(result[0].projectId).toBe('project1');
      expect(result[0].decision).toBe('budget_approval');
      expect(result[0].priority).toBe(10);
    });
  });

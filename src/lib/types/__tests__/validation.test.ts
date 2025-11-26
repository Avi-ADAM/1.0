/**
 * Tests for Strapi validation utilities
 * 
 * These tests verify that the Yup schemas correctly validate
 * API responses and match the TypeScript type definitions.
 */

import { describe, it, expect } from 'vitest';
import {
  validateResponse,
  validateResponseSync,
  safeValidate,
  isValidResponse,
  userProjectListResponseSchema,
  checkProjectMembershipResponseSchema,
  projectDetailsResponseSchema,
  strapiMediaSchema,
  createStrapiEntitySchema,
  createStrapiCollectionSchema
} from '../validation';
import * as yup from 'yup';

describe('Strapi Validation Utilities', () => {
  describe('strapiMediaSchema', () => {
    it('should validate valid media object', async () => {
      const validMedia = {
        data: {
          id: '1',
          attributes: {
            url: '/uploads/image.jpg',
            name: 'image.jpg',
            width: 800,
            height: 600
          }
        }
      };

      const result = await validateResponse(strapiMediaSchema, validMedia);
      expect(result).toEqual(validMedia);
    });

    it('should validate null media object', async () => {
      const nullMedia = { data: null };
      const result = await validateResponse(strapiMediaSchema, nullMedia);
      expect(result.data).toBeNull();
    });

    it('should reject invalid media object', async () => {
      const invalidMedia = {
        data: {
          id: '1',
          attributes: {
            // Missing required 'url' field
            name: 'image.jpg'
          }
        }
      };

      await expect(validateResponse(strapiMediaSchema, invalidMedia)).rejects.toThrow();
    });
  });

  describe('createStrapiEntitySchema', () => {
    it('should validate valid entity', async () => {
      const schema = createStrapiEntitySchema(
        yup.object({
          username: yup.string().required(),
          email: yup.string().email().required()
        })
      );

      const validEntity = {
        data: {
          id: '1',
          attributes: {
            username: 'john',
            email: 'john@example.com'
          }
        }
      };

      const result = await validateResponse(schema, validEntity);
      expect(result).toEqual(validEntity);
    });

    it('should validate null entity', async () => {
      const schema = createStrapiEntitySchema(
        yup.object({
          username: yup.string().required()
        })
      );

      const nullEntity = { data: null };
      const result = await validateResponse(schema, nullEntity);
      expect(result.data).toBeNull();
    });

    it('should reject entity with missing required field', async () => {
      const schema = createStrapiEntitySchema(
        yup.object({
          username: yup.string().required(),
          email: yup.string().email().required()
        })
      );

      const invalidEntity = {
        data: {
          id: '1',
          attributes: {
            username: 'john'
            // Missing required 'email' field
          }
        }
      };

      await expect(validateResponse(schema, invalidEntity)).rejects.toThrow();
    });
  });

  describe('createStrapiCollectionSchema', () => {
    it('should validate valid collection', async () => {
      const schema = createStrapiCollectionSchema(
        yup.object({
          projectName: yup.string().required()
        })
      );

      const validCollection = {
        data: [
          {
            id: '1',
            attributes: {
              projectName: 'Project 1'
            }
          },
          {
            id: '2',
            attributes: {
              projectName: 'Project 2'
            }
          }
        ]
      };

      const result = await validateResponse(schema, validCollection);
      expect(result).toEqual(validCollection);
    });

    it('should validate empty collection', async () => {
      const schema = createStrapiCollectionSchema(
        yup.object({
          projectName: yup.string().required()
        })
      );

      const emptyCollection = { data: [] };
      const result = await validateResponse(schema, emptyCollection);
      expect(result.data).toEqual([]);
    });

    it('should reject collection with invalid item', async () => {
      const schema = createStrapiCollectionSchema(
        yup.object({
          projectName: yup.string().required()
        })
      );

      const invalidCollection = {
        data: [
          {
            id: '1',
            attributes: {
              projectName: 'Project 1'
            }
          },
          {
            id: '2',
            attributes: {
              // Missing required 'projectName' field
            }
          }
        ]
      };

      await expect(validateResponse(schema, invalidCollection)).rejects.toThrow();
    });
  });

  describe('userProjectListResponseSchema', () => {
    it('should validate valid user project list response', async () => {
      const validResponse = {
        data: {
          usersPermissionsUser: {
            data: {
              id: '1',
              attributes: {
                projects_1s: {
                  data: [
                    {
                      id: '10',
                      attributes: {
                        projectName: 'My Project'
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      };

      const result = await validateResponse(userProjectListResponseSchema, validResponse);
      expect(result).toEqual(validResponse);
    });

    it('should validate response with null user', async () => {
      const responseWithNullUser = {
        data: {
          usersPermissionsUser: {
            data: null
          }
        }
      };

      const result = await validateResponse(userProjectListResponseSchema, responseWithNullUser);
      expect(result.data.usersPermissionsUser.data).toBeNull();
    });

    it('should validate response with empty projects', async () => {
      const responseWithEmptyProjects = {
        data: {
          usersPermissionsUser: {
            data: {
              id: '1',
              attributes: {
                projects_1s: {
                  data: []
                }
              }
            }
          }
        }
      };

      const result = await validateResponse(userProjectListResponseSchema, responseWithEmptyProjects);
      expect(result.data.usersPermissionsUser.data?.attributes.projects_1s.data).toEqual([]);
    });
  });

  describe('checkProjectMembershipResponseSchema', () => {
    it('should validate valid project membership response', async () => {
      const validResponse = {
        data: {
          usersPermissionsUser: {
            data: {
              id: '1',
              attributes: {
                projects_1s: {
                  data: [
                    {
                      id: '10',
                      attributes: {
                        projectName: 'My Project',
                        createdAt: '2024-01-01T00:00:00.000Z',
                        profilePic: {
                          data: {
                            id: '5',
                            attributes: {
                              url: '/uploads/pic.jpg'
                            }
                          }
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      };

      const result = await validateResponse(checkProjectMembershipResponseSchema, validResponse);
      expect(result).toEqual(validResponse);
    });

    it('should validate response with null profile pic', async () => {
      const responseWithNullPic = {
        data: {
          usersPermissionsUser: {
            data: {
              id: '1',
              attributes: {
                projects_1s: {
                  data: [
                    {
                      id: '10',
                      attributes: {
                        projectName: 'My Project',
                        createdAt: '2024-01-01T00:00:00.000Z',
                        profilePic: {
                          data: null
                        }
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      };

      const result = await validateResponse(checkProjectMembershipResponseSchema, responseWithNullPic);
      expect(result.data.usersPermissionsUser.data?.attributes.projects_1s.data[0].attributes.profilePic.data).toBeNull();
    });
  });

  describe('validateResponseSync', () => {
    it('should validate synchronously', () => {
      const validResponse = {
        data: {
          usersPermissionsUser: {
            data: {
              id: '1',
              attributes: {
                projects_1s: {
                  data: []
                }
              }
            }
          }
        }
      };

      const result = validateResponseSync(userProjectListResponseSchema, validResponse);
      expect(result).toEqual(validResponse);
    });

    it('should throw synchronously on invalid data', () => {
      const invalidResponse = {
        data: {
          usersPermissionsUser: {
            data: {
              id: '1',
              attributes: {
                projects_1s: {
                  data: [
                    {
                      id: '1',
                      attributes: {
                        // Missing required 'projectName' field
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      };

      expect(() => validateResponseSync(userProjectListResponseSchema, invalidResponse)).toThrow();
    });
  });

  describe('safeValidate', () => {
    it('should return success result for valid data', async () => {
      const validResponse = {
        data: {
          usersPermissionsUser: {
            data: {
              id: '1',
              attributes: {
                projects_1s: {
                  data: []
                }
              }
            }
          }
        }
      };

      const result = await safeValidate(userProjectListResponseSchema, validResponse);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(validResponse);
        expect(result.errors).toBeNull();
      }
    });

    it('should return error result for invalid data', async () => {
      const invalidResponse = {
        data: {
          usersPermissionsUser: {
            data: {
              id: '1',
              attributes: {
                projects_1s: {
                  data: [
                    {
                      id: '1',
                      attributes: {
                        // Missing required 'projectName' field
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      };

      const result = await safeValidate(userProjectListResponseSchema, invalidResponse);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.data).toBeNull();
        expect(result.errors).toBeDefined();
        expect(result.errors.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('isValidResponse', () => {
    it('should return true for valid data', () => {
      const validResponse = {
        data: {
          usersPermissionsUser: {
            data: {
              id: '1',
              attributes: {
                projects_1s: {
                  data: []
                }
              }
            }
          }
        }
      };

      expect(isValidResponse(userProjectListResponseSchema, validResponse)).toBe(true);
    });

    it('should return false for invalid data', () => {
      const invalidResponse = {
        data: {
          usersPermissionsUser: {
            data: {
              id: '1',
              attributes: {
                projects_1s: {
                  data: [
                    {
                      id: '1',
                      attributes: {
                        // Missing required 'projectName' field
                      }
                    }
                  ]
                }
              }
            }
          }
        }
      };

      expect(isValidResponse(userProjectListResponseSchema, invalidResponse)).toBe(false);
    });

    it('should work as type guard', () => {
      const response: unknown = {
        data: {
          usersPermissionsUser: {
            data: {
              id: '1',
              attributes: {
                projects_1s: {
                  data: []
                }
              }
            }
          }
        }
      };

      if (isValidResponse(userProjectListResponseSchema, response)) {
        // TypeScript should know response is UserProjectListResponse
        const projects = response.data.usersPermissionsUser.data?.attributes.projects_1s.data;
        expect(projects).toEqual([]);
      }
    });
  });

  describe('projectDetailsResponseSchema', () => {
    it('should validate complex project details response', async () => {
      const validResponse = {
        data: {
          project: {
            data: {
              id: '1',
              attributes: {
                projectName: 'Test Project',
                user_1s: { data: [] },
                linkToWebsite: 'https://example.com',
                restime: null,
                sheiruts: { data: [] },
                githublink: null,
                fblink: null,
                discordlink: null,
                twiterlink: null,
                vallues: { data: [] },
                publicDescription: 'A test project',
                profilePic: { data: null },
                open_missions: { data: [] }
              }
            }
          }
        }
      };

      const result = await validateResponse(projectDetailsResponseSchema, validResponse);
      expect(result).toEqual(validResponse);
    });

    it('should validate project with members and values', async () => {
      const validResponse = {
        data: {
          project: {
            data: {
              id: '1',
              attributes: {
                projectName: 'Test Project',
                user_1s: {
                  data: [
                    {
                      id: '10',
                      attributes: {
                        username: 'john',
                        email: 'john@example.com',
                        profilePic: { data: null }
                      }
                    }
                  ]
                },
                linkToWebsite: null,
                restime: null,
                sheiruts: { data: [] },
                githublink: null,
                fblink: null,
                discordlink: null,
                twiterlink: null,
                vallues: {
                  data: [
                    {
                      id: '20',
                      attributes: {
                        valueName: 'Innovation'
                      }
                    }
                  ]
                },
                publicDescription: null,
                profilePic: { data: null },
                open_missions: { data: [] }
              }
            }
          }
        }
      };

      const result = await validateResponse(projectDetailsResponseSchema, validResponse);
      expect(result.data.project.data?.attributes.user_1s.data).toHaveLength(1);
      expect(result.data.project.data?.attributes.vallues.data).toHaveLength(1);
    });
  });
});

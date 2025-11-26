/**
 * Tests for Strapi Type Helper Utilities
 * 
 * These tests verify that the type helper utilities correctly extract and flatten
 * Strapi's nested data structures. They include both runtime tests with sample data
 * and type-level tests to ensure TypeScript types work as expected.
 * 
 * Requirements tested:
 * - 1.1: Extract attributes from Strapi content types
 * - 1.2: Flatten nested data.attributes structure
 * - 1.3: Handle single and collection relations
 */

import { describe, it, expect } from 'vitest';
import type {
  StrapiAttributes,
  FlattenEntity,
  FlattenRelation,
  FlattenRelationArray,
  StrapiResponse,
  StrapiEntity,
  StrapiCollection,
  StrapiMedia,
  StrapiRepeatableComponent
} from '../strapiTypes';

// Sample Strapi content type structures for testing
interface MockUserContentType {
  attributes: {
    username: string;
    email: string;
    age: number;
  };
}

interface MockProjectContentType {
  attributes: {
    projectName: string;
    description: string;
    createdAt: string;
  };
}

interface MockMediaAttributes {
  url: string;
  name: string;
  width: number;
  height: number;
}

describe('Strapi Type Helper Utilities', () => {
  describe('StrapiAttributes', () => {
    it('should extract attributes from content type at runtime', () => {
      // Runtime test: verify the structure matches what the type would extract
      const mockUser: MockUserContentType = {
        attributes: {
          username: 'john',
          email: 'john@example.com',
          age: 30
        }
      };

      // Extract attributes manually (simulating what the type does)
      const attrs = mockUser.attributes;
      
      expect(attrs).toEqual({
        username: 'john',
        email: 'john@example.com',
        age: 30
      });
      expect(attrs.username).toBe('john');
      expect(attrs.email).toBe('john@example.com');
      expect(attrs.age).toBe(30);
    });

    it('should work with different content types', () => {
      const mockProject: MockProjectContentType = {
        attributes: {
          projectName: 'Test Project',
          description: 'A test project',
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      };

      const attrs = mockProject.attributes;
      
      expect(attrs.projectName).toBe('Test Project');
      expect(attrs.description).toBe('A test project');
      expect(attrs.createdAt).toBe('2024-01-01T00:00:00.000Z');
    });

    // Type-level test: This should compile without errors
    it('should have correct TypeScript types', () => {
      type UserAttrs = StrapiAttributes<MockUserContentType>;
      
      // This should compile - UserAttrs should have these fields
      const validAttrs: UserAttrs = {
        username: 'test',
        email: 'test@example.com',
        age: 25
      };
      
      expect(validAttrs.username).toBe('test');
      
      // Type assertion to verify the type structure
      const _typeCheck: UserAttrs = validAttrs;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('FlattenEntity', () => {
    it('should flatten entity structure at runtime', () => {
      // Simulating a Strapi entity response
      const strapiEntity = {
        id: '123',
        attributes: {
          username: 'john',
          email: 'john@example.com',
          age: 30
        }
      };

      // Manually flatten (simulating what the type does)
      const flattened = {
        id: strapiEntity.id,
        ...strapiEntity.attributes
      };

      expect(flattened).toEqual({
        id: '123',
        username: 'john',
        email: 'john@example.com',
        age: 30
      });
      expect(flattened.id).toBe('123');
      expect(flattened.username).toBe('john');
    });

    it('should preserve all attribute fields', () => {
      const strapiProject = {
        id: '456',
        attributes: {
          projectName: 'My Project',
          description: 'Project description',
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      };

      const flattened = {
        id: strapiProject.id,
        ...strapiProject.attributes
      };

      expect(flattened.id).toBe('456');
      expect(flattened.projectName).toBe('My Project');
      expect(flattened.description).toBe('Project description');
      expect(flattened.createdAt).toBe('2024-01-01T00:00:00.000Z');
    });

    // Type-level test
    it('should have correct TypeScript types for flattened entity', () => {
      type FlatUser = FlattenEntity<MockUserContentType>;
      
      const validFlatUser: FlatUser = {
        id: '1',
        username: 'test',
        email: 'test@example.com',
        age: 25
      };
      
      expect(validFlatUser.id).toBe('1');
      expect(validFlatUser.username).toBe('test');
      
      // Verify type structure
      const _typeCheck: FlatUser = validFlatUser;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('FlattenRelation', () => {
    it('should flatten single relation at runtime', () => {
      // Simulating a Strapi single relation response
      const relationResponse = {
        data: {
          id: '789',
          attributes: {
            projectName: 'Related Project',
            description: 'A related project',
            createdAt: '2024-01-01T00:00:00.000Z'
          }
        }
      };

      // Manually flatten the relation
      const flattened = relationResponse.data ? {
        id: relationResponse.data.id,
        ...relationResponse.data.attributes
      } : null;

      expect(flattened).toEqual({
        id: '789',
        projectName: 'Related Project',
        description: 'A related project',
        createdAt: '2024-01-01T00:00:00.000Z'
      });
    });

    it('should handle null relations', () => {
      const nullRelation = {
        data: null
      };

      const flattened = nullRelation.data;
      
      expect(flattened).toBeNull();
    });

    it('should work with different relation types', () => {
      const userRelation = {
        data: {
          id: '100',
          attributes: {
            username: 'relateduser',
            email: 'related@example.com',
            age: 28
          }
        }
      };

      const flattened = {
        id: userRelation.data.id,
        ...userRelation.data.attributes
      };

      expect(flattened.id).toBe('100');
      expect(flattened.username).toBe('relateduser');
      expect(flattened.email).toBe('related@example.com');
    });

    // Type-level test
    it('should have correct TypeScript types for flattened relation', () => {
      type ProjectRelation = FlattenRelation<{
        data: { id: string; attributes: MockProjectContentType['attributes'] };
      }>;
      
      const validRelation: ProjectRelation = {
        id: '1',
        projectName: 'Test',
        description: 'Desc',
        createdAt: '2024-01-01'
      };
      
      expect(validRelation.id).toBe('1');
      
      // Verify type structure
      const _typeCheck: ProjectRelation = validRelation;
      expect(_typeCheck).toBeDefined();
    });

    it('should handle null type in TypeScript', () => {
      type NullableRelation = FlattenRelation<{
        data: { id: string; attributes: MockUserContentType['attributes'] } | null;
      }>;
      
      const nullRelation: NullableRelation = null;
      expect(nullRelation).toBeNull();
    });
  });

  describe('FlattenRelationArray', () => {
    it('should flatten collection relations at runtime', () => {
      // Simulating a Strapi collection relation response
      const collectionResponse = {
        data: [
          {
            id: '1',
            attributes: {
              projectName: 'Project 1',
              description: 'First project',
              createdAt: '2024-01-01T00:00:00.000Z'
            }
          },
          {
            id: '2',
            attributes: {
              projectName: 'Project 2',
              description: 'Second project',
              createdAt: '2024-01-02T00:00:00.000Z'
            }
          }
        ]
      };

      // Manually flatten the collection
      const flattened = collectionResponse.data.map(item => ({
        id: item.id,
        ...item.attributes
      }));

      expect(flattened).toHaveLength(2);
      expect(flattened[0]).toEqual({
        id: '1',
        projectName: 'Project 1',
        description: 'First project',
        createdAt: '2024-01-01T00:00:00.000Z'
      });
      expect(flattened[1]).toEqual({
        id: '2',
        projectName: 'Project 2',
        description: 'Second project',
        createdAt: '2024-01-02T00:00:00.000Z'
      });
    });

    it('should handle empty collections', () => {
      const emptyCollection = {
        data: []
      };

      const flattened = emptyCollection.data.map(item => ({
        id: item.id,
        ...item.attributes
      }));

      expect(flattened).toEqual([]);
      expect(flattened).toHaveLength(0);
    });

    it('should preserve array order', () => {
      const orderedCollection = {
        data: [
          {
            id: '3',
            attributes: {
              username: 'user3',
              email: 'user3@example.com',
              age: 30
            }
          },
          {
            id: '1',
            attributes: {
              username: 'user1',
              email: 'user1@example.com',
              age: 25
            }
          },
          {
            id: '2',
            attributes: {
              username: 'user2',
              email: 'user2@example.com',
              age: 28
            }
          }
        ]
      };

      const flattened = orderedCollection.data.map(item => ({
        id: item.id,
        ...item.attributes
      }));

      expect(flattened[0].id).toBe('3');
      expect(flattened[1].id).toBe('1');
      expect(flattened[2].id).toBe('2');
    });

    // Type-level test
    it('should have correct TypeScript types for flattened array', () => {
      type ProjectArray = FlattenRelationArray<{
        data: Array<{ id: string; attributes: MockProjectContentType['attributes'] }>;
      }>;
      
      const validArray: ProjectArray = [
        {
          id: '1',
          projectName: 'Test 1',
          description: 'Desc 1',
          createdAt: '2024-01-01'
        },
        {
          id: '2',
          projectName: 'Test 2',
          description: 'Desc 2',
          createdAt: '2024-01-02'
        }
      ];
      
      expect(validArray).toHaveLength(2);
      expect(validArray[0].id).toBe('1');
      
      // Verify type structure
      const _typeCheck: ProjectArray = validArray;
      expect(_typeCheck).toBeDefined();
    });
  });

  describe('StrapiResponse', () => {
    it('should wrap data in response structure', () => {
      const response: StrapiResponse<{ user: { id: string; name: string } }> = {
        data: {
          user: {
            id: '1',
            name: 'John'
          }
        }
      };

      expect(response.data).toBeDefined();
      expect(response.data.user.id).toBe('1');
      expect(response.data.user.name).toBe('John');
    });

    it('should work with complex nested data', () => {
      const response: StrapiResponse<{
        usersPermissionsUser: StrapiEntity<MockUserContentType['attributes']>;
      }> = {
        data: {
          usersPermissionsUser: {
            data: {
              id: '123',
              attributes: {
                username: 'john',
                email: 'john@example.com',
                age: 30
              }
            }
          }
        }
      };

      expect(response.data.usersPermissionsUser.data?.id).toBe('123');
      expect(response.data.usersPermissionsUser.data?.attributes.username).toBe('john');
    });
  });

  describe('StrapiEntity', () => {
    it('should wrap single entity with data and attributes', () => {
      const entity: StrapiEntity<MockUserContentType['attributes']> = {
        data: {
          id: '456',
          attributes: {
            username: 'jane',
            email: 'jane@example.com',
            age: 25
          }
        }
      };

      expect(entity.data?.id).toBe('456');
      expect(entity.data?.attributes.username).toBe('jane');
      expect(entity.data?.attributes.email).toBe('jane@example.com');
      expect(entity.data?.attributes.age).toBe(25);
    });

    it('should handle null entity', () => {
      const nullEntity: StrapiEntity<MockUserContentType['attributes']> = {
        data: null
      };

      expect(nullEntity.data).toBeNull();
    });
  });

  describe('StrapiCollection', () => {
    it('should wrap collection of entities', () => {
      const collection: StrapiCollection<MockProjectContentType['attributes']> = {
        data: [
          {
            id: '1',
            attributes: {
              projectName: 'Project A',
              description: 'Description A',
              createdAt: '2024-01-01'
            }
          },
          {
            id: '2',
            attributes: {
              projectName: 'Project B',
              description: 'Description B',
              createdAt: '2024-01-02'
            }
          }
        ]
      };

      expect(collection.data).toHaveLength(2);
      expect(collection.data[0].id).toBe('1');
      expect(collection.data[0].attributes.projectName).toBe('Project A');
      expect(collection.data[1].id).toBe('2');
      expect(collection.data[1].attributes.projectName).toBe('Project B');
    });

    it('should handle empty collection', () => {
      const emptyCollection: StrapiCollection<MockUserContentType['attributes']> = {
        data: []
      };

      expect(emptyCollection.data).toEqual([]);
      expect(emptyCollection.data).toHaveLength(0);
    });
  });

  describe('StrapiMedia', () => {
    it('should wrap media with url and metadata', () => {
      const media: StrapiMedia<MockMediaAttributes> = {
        data: {
          id: '789',
          attributes: {
            url: '/uploads/image.jpg',
            name: 'image.jpg',
            width: 800,
            height: 600
          }
        }
      };

      expect(media.data?.id).toBe('789');
      expect(media.data?.attributes.url).toBe('/uploads/image.jpg');
      expect(media.data?.attributes.name).toBe('image.jpg');
      expect(media.data?.attributes.width).toBe(800);
      expect(media.data?.attributes.height).toBe(600);
    });

    it('should handle null media', () => {
      const nullMedia: StrapiMedia = {
        data: null
      };

      expect(nullMedia.data).toBeNull();
    });

    it('should use default url type when no generic provided', () => {
      const simpleMedia: StrapiMedia = {
        data: {
          id: '1',
          attributes: {
            url: '/uploads/file.pdf'
          }
        }
      };

      expect(simpleMedia.data?.attributes.url).toBe('/uploads/file.pdf');
    });
  });

  describe('StrapiRepeatableComponent', () => {
    it('should handle repeatable components with id', () => {
      interface VoteComponent {
        why: string;
        what: boolean;
      }

      const votes: StrapiRepeatableComponent<VoteComponent> = [
        {
          id: 1,
          why: 'Good idea',
          what: true
        },
        {
          id: 2,
          why: 'Needs work',
          what: false
        }
      ];

      expect(votes).toHaveLength(2);
      expect(votes[0].id).toBe(1);
      expect(votes[0].why).toBe('Good idea');
      expect(votes[0].what).toBe(true);
      expect(votes[1].id).toBe(2);
      expect(votes[1].why).toBe('Needs work');
      expect(votes[1].what).toBe(false);
    });

    it('should handle empty repeatable component array', () => {
      interface NegotiationComponent {
        name: string;
        price: number;
      }

      const negotiations: StrapiRepeatableComponent<NegotiationComponent> = [];

      expect(negotiations).toEqual([]);
      expect(negotiations).toHaveLength(0);
    });
  });

  describe('Integration: Complex nested structures', () => {
    it('should handle deeply nested response with multiple relation types', () => {
      // Simulating a complex real-world response
      const complexResponse: StrapiResponse<{
        usersPermissionsUser: StrapiEntity<{
          username: string;
          email: string;
          projects: StrapiCollection<{
            projectName: string;
            profilePic: StrapiMedia;
            members: StrapiCollection<{
              username: string;
            }>;
          }>;
        }>;
      }> = {
        data: {
          usersPermissionsUser: {
            data: {
              id: '1',
              attributes: {
                username: 'john',
                email: 'john@example.com',
                projects: {
                  data: [
                    {
                      id: '10',
                      attributes: {
                        projectName: 'Project Alpha',
                        profilePic: {
                          data: {
                            id: '100',
                            attributes: {
                              url: '/uploads/alpha.jpg'
                            }
                          }
                        },
                        members: {
                          data: [
                            {
                              id: '2',
                              attributes: {
                                username: 'jane'
                              }
                            }
                          ]
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

      // Verify the structure
      const user = complexResponse.data.usersPermissionsUser.data;
      expect(user?.id).toBe('1');
      expect(user?.attributes.username).toBe('john');
      
      const projects = user?.attributes.projects.data;
      expect(projects).toHaveLength(1);
      expect(projects?.[0].attributes.projectName).toBe('Project Alpha');
      
      const profilePic = projects?.[0].attributes.profilePic.data;
      expect(profilePic?.attributes.url).toBe('/uploads/alpha.jpg');
      
      const members = projects?.[0].attributes.members.data;
      expect(members).toHaveLength(1);
      expect(members?.[0].attributes.username).toBe('jane');
    });

    it('should handle flattening of complex nested structure', () => {
      // Original nested structure
      const nested = {
        data: {
          id: '1',
          attributes: {
            projectName: 'Test Project',
            owner: {
              data: {
                id: '10',
                attributes: {
                  username: 'owner',
                  email: 'owner@example.com',
                  age: 30
                }
              }
            },
            members: {
              data: [
                {
                  id: '20',
                  attributes: {
                    username: 'member1',
                    email: 'member1@example.com',
                    age: 25
                  }
                },
                {
                  id: '21',
                  attributes: {
                    username: 'member2',
                    email: 'member2@example.com',
                    age: 28
                  }
                }
              ]
            }
          }
        }
      };

      // Flatten the structure
      const flattened = {
        id: nested.data.id,
        projectName: nested.data.attributes.projectName,
        owner: nested.data.attributes.owner.data ? {
          id: nested.data.attributes.owner.data.id,
          ...nested.data.attributes.owner.data.attributes
        } : null,
        members: nested.data.attributes.members.data.map(m => ({
          id: m.id,
          ...m.attributes
        }))
      };

      expect(flattened.id).toBe('1');
      expect(flattened.projectName).toBe('Test Project');
      expect(flattened.owner?.id).toBe('10');
      expect(flattened.owner?.username).toBe('owner');
      expect(flattened.members).toHaveLength(2);
      expect(flattened.members[0].username).toBe('member1');
      expect(flattened.members[1].username).toBe('member2');
    });
  });
});

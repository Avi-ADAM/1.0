/**
 * Runtime Validation Utilities for Strapi API Responses
 * 
 * This module provides Yup schemas for validating API responses at runtime.
 * These schemas match the TypeScript types defined in strapiTypes.ts and queryTypes.ts,
 * providing both compile-time type safety and runtime validation.
 * 
 * @module validation
 */

import * as yup from 'yup';

/**
 * Base schema for Strapi media/file objects
 * Validates the nested data.attributes structure for media fields
 */
export const strapiMediaSchema = yup.object({
  data: yup.object({
    id: yup.string().required(),
    attributes: yup.object({
      url: yup.string().required(),
      formats: yup.mixed().nullable().optional(),
      name: yup.string().optional(),
      width: yup.number().optional(),
      height: yup.number().optional()
    }).required()
  }).nullable().default(null)
});

/**
 * Base schema for Strapi entity wrapper (single entity)
 * Validates the data.attributes structure for single content type entries
 */
export const createStrapiEntitySchema = <T extends yup.AnyObject>(attributesSchema: yup.ObjectSchema<T>) => {
  return yup.object({
    data: yup.object({
      id: yup.string().required(),
      attributes: attributesSchema.required()
    }).nullable().default(null)
  });
};

/**
 * Base schema for Strapi collection wrapper (multiple entities)
 * Validates the data array structure for collection content type entries
 */
export const createStrapiCollectionSchema = <T extends yup.AnyObject>(attributesSchema: yup.ObjectSchema<T>) => {
  return yup.object({
    data: yup.array().of(
      yup.object({
        id: yup.string().required(),
        attributes: attributesSchema.required()
      }).required()
    ).required().default([])
  });
};

/**
 * Base schema for Strapi GraphQL response wrapper
 * All GraphQL responses are wrapped in { data: ... }
 */
export const createStrapiResponseSchema = <T extends yup.AnyObject>(dataSchema: yup.ObjectSchema<T>) => {
  return yup.object({
    data: dataSchema.required()
  });
};

/**
 * Schema for localization data (common pattern in Strapi)
 */
const localizationSchema = yup.object({
  valueName: yup.string().optional(),
  skillName: yup.string().optional(),
  roleDescription: yup.string().optional(),
  workWayName: yup.string().optional()
});

/**
 * Schema for project basic attributes
 */
const projectBasicAttributesSchema = yup.object({
  projectName: yup.string().required(),
  profilePic: strapiMediaSchema.optional(),
  createdAt: yup.string().optional()
});

/**
 * Schema for user basic attributes
 */
const userBasicAttributesSchema = yup.object({
  username: yup.string().required(),
  email: yup.string().email().optional(),
  profilePic: strapiMediaSchema.optional()
});

/**
 * Validation schema for UserProjectListResponse
 * Validates the response from getUserProjectList query (qid: 64getUserProjectList)
 * 
 * @example
 * ```typescript
 * import { userProjectListResponseSchema } from '$lib/types/validation';
 * 
 * try {
 *   const validatedData = await userProjectListResponseSchema.validate(apiResponse);
 *   // Data is now validated and safe to use
 * } catch (error) {
 *   console.error('Validation failed:', error.message);
 * }
 * ```
 */
export const userProjectListResponseSchema = createStrapiResponseSchema(
  yup.object({
    usersPermissionsUser: createStrapiEntitySchema(
      yup.object({
        projects_1s: createStrapiCollectionSchema(
          yup.object({
            projectName: yup.string().required()
          })
        ).required()
      })
    ).required()
  })
);

/**
 * Validation schema for CheckProjectMembershipResponse
 * Validates the response from checkProjectMembership query (qid: 65checkProjectMembership)
 */
export const checkProjectMembershipResponseSchema = createStrapiResponseSchema(
  yup.object({
    usersPermissionsUser: createStrapiEntitySchema(
      yup.object({
        projects_1s: createStrapiCollectionSchema(
          projectBasicAttributesSchema
        ).required()
      })
    ).required()
  })
);

/**
 * Validation schema for ProjectDetailsResponse
 * Validates the response from GetProjectById query (qid: 49GetProjectById)
 */
export const projectDetailsResponseSchema = createStrapiResponseSchema(
  yup.object({
    project: createStrapiEntitySchema(
      yup.object({
        projectName: yup.string().required(),
        user_1s: createStrapiCollectionSchema(userBasicAttributesSchema).required(),
        linkToWebsite: yup.string().url().nullable().default(null),
        restime: yup.string().nullable().default(null),
        sheiruts: createStrapiCollectionSchema(
          yup.object({
            name: yup.string().required(),
            descrip: yup.string().required(),
            equaliSplited: yup.boolean().required(),
            oneTime: yup.boolean().required(),
            isApruved: yup.boolean().required()
          })
        ).required(),
        githublink: yup.string().url().nullable().default(null),
        fblink: yup.string().url().nullable().default(null),
        discordlink: yup.string().url().nullable().default(null),
        twiterlink: yup.string().url().nullable().default(null),
        vallues: createStrapiCollectionSchema(
          yup.object({
            valueName: yup.string().required(),
            localizations: createStrapiCollectionSchema(localizationSchema).optional()
          })
        ).required(),
        publicDescription: yup.string().nullable().default(null),
        profilePic: strapiMediaSchema.optional(),
        open_missions: createStrapiCollectionSchema(
          yup.object({
            name: yup.string().required()
          })
        ).required()
      })
    ).required()
  })
);

/**
 * Validation schema for UserDetailsResponse
 * Validates the response from GetUserById query (qid: 52GetUserById)
 */
export const userDetailsResponseSchema = createStrapiResponseSchema(
  yup.object({
    usersPermissionsUser: createStrapiEntitySchema(
      yup.object({
        fblink: yup.string().url().nullable().default(null),
        twiterlink: yup.string().url().nullable().default(null),
        discordlink: yup.string().url().nullable().default(null),
        githublink: yup.string().url().nullable().default(null),
        bio: yup.string().nullable().default(null),
        username: yup.string().required(),
        finnished_missions: createStrapiCollectionSchema(
          yup.object({
            missionName: yup.string().required()
          })
        ).required(),
        profilePic: strapiMediaSchema.optional(),
        projects_1s: createStrapiCollectionSchema(
          yup.object({
            projectName: yup.string().required()
          })
        ).required(),
        sps: createStrapiCollectionSchema(
          yup.object({
            name: yup.string().required(),
            panui: yup.boolean().required()
          })
        ).required(),
        skills: createStrapiCollectionSchema(
          yup.object({
            skillName: yup.string().required(),
            localizations: createStrapiCollectionSchema(localizationSchema).optional()
          })
        ).required(),
        tafkidims: createStrapiCollectionSchema(
          yup.object({
            roleDescription: yup.string().required(),
            localizations: createStrapiCollectionSchema(localizationSchema).optional()
          })
        ).required(),
        vallues: createStrapiCollectionSchema(
          yup.object({
            valueName: yup.string().required(),
            localizations: createStrapiCollectionSchema(localizationSchema).optional()
          })
        ).required(),
        work_ways: createStrapiCollectionSchema(
          yup.object({
            workWayName: yup.string().required(),
            localizations: createStrapiCollectionSchema(localizationSchema).optional()
          })
        ).required()
      })
    ).required()
  })
);

/**
 * Validation schema for OpenMissionDetailsResponse
 * Validates the response from GetOpenMissionById query (qid: 51GetOpenMissionById)
 */
export const openMissionDetailsResponseSchema = createStrapiResponseSchema(
  yup.object({
    openMission: createStrapiEntitySchema(
      yup.object({
        sqadualed: yup.string().nullable().default(null),
        archived: yup.boolean().required(),
        acts: createStrapiCollectionSchema(
          yup.object({
            shem: yup.string().required(),
            des: yup.string().required(),
            dateF: yup.string().nullable().default(null),
            dateS: yup.string().nullable().default(null),
            link: yup.string().url().nullable().default(null)
          })
        ).required(),
        users: createStrapiCollectionSchema(yup.object({})).required(),
        mission: createStrapiCollectionSchema(yup.object({})).required(),
        project: createStrapiEntitySchema(
          yup.object({
            projectName: yup.string().required(),
            user_1s: createStrapiCollectionSchema(yup.object({})).required(),
            restime: yup.string().nullable().default(null),
            timeToP: yup.string().nullable().default(null),
            profilePic: strapiMediaSchema.optional()
          })
        ).required(),
        tafkidims: createStrapiCollectionSchema(
          yup.object({
            roleDescription: yup.string().required(),
            localizations: createStrapiCollectionSchema(localizationSchema).optional()
          })
        ).required(),
        skills: createStrapiCollectionSchema(
          yup.object({
            skillName: yup.string().required(),
            localizations: createStrapiCollectionSchema(localizationSchema).optional()
          })
        ).required(),
        descrip: yup.string().required(),
        hearotMeyuchadot: yup.string().nullable().default(null),
        name: yup.string().required(),
        dates: yup.string().nullable().default(null),
        iskvua: yup.boolean().required(),
        privatlinks: yup.string().nullable().default(null),
        publicklinks: yup.string().nullable().default(null),
        work_ways: createStrapiCollectionSchema(
          yup.object({
            workWayName: yup.string().required(),
            localizations: createStrapiCollectionSchema(localizationSchema).optional()
          })
        ).required(),
        noofhours: yup.number().required(),
        perhour: yup.number().required()
      })
    ).required()
  })
);

/**
 * Validation schema for MissionsOnProgressResponse
 * Validates the response from GetMissionsOnProgress query (qid: 8getMissionsOnProgress)
 */
export const missionsOnProgressResponseSchema = createStrapiResponseSchema(
  yup.object({
    usersPermissionsUser: createStrapiEntitySchema(
      yup.object({
        username: yup.string().required(),
        telegramId: yup.string().nullable().default(null),
        lang: yup.string().nullable().default(null),
        mesimabetahaliches: createStrapiCollectionSchema(
          yup.object({
            name: yup.string().required(),
            stname: yup.string().nullable().default(null),
            timer: yup.number().nullable().default(null),
            howmanyhoursalready: yup.number().required(),
            hoursassinged: yup.number().required(),
            acts: createStrapiCollectionSchema(
              yup.object({
                shem: yup.string().required(),
                myIshur: yup.boolean().required(),
                link: yup.string().url().nullable().default(null),
                hashivut: yup.string().nullable().default(null),
                valiIshur: yup.boolean().required(),
                des: yup.string().required(),
                dateF: yup.string().nullable().default(null),
                dateS: yup.string().nullable().default(null),
                status: yup.number().nullable().default(null),
                naasa: yup.boolean().required()
              })
            ).required(),
            activeTimer: createStrapiEntitySchema(
              yup.object({
                start: yup.string().required(),
                totalHours: yup.number().required(),
                timers: yup.array().of(
                  yup.object({
                    start: yup.string().required(),
                    stop: yup.string().nullable().default(null)
                  }).required()
                ).required(),
                acts: createStrapiCollectionSchema(yup.object({})).required(),
                isActive: yup.boolean().required(),
                saved: yup.boolean().required()
              })
            ).required(),
            project: createStrapiEntitySchema(
              yup.object({
                projectName: yup.string().required(),
                profilePic: strapiMediaSchema.optional()
              })
            ).required()
          })
        ).required()
      })
    ).required()
  })
);

/**
 * Validation schema for NegotiationDetailsResponse
 * Validates the response from GetNegotiation query (qid: 39GetNegotiation)
 */
export const negotiationDetailsResponseSchema = createStrapiResponseSchema(
  yup.object({
    negotiation: createStrapiEntitySchema(
      yup.object({
        topic: yup.string().required(),
        description: yup.string().required(),
        status: yup.string().required(),
        maxRounds: yup.number().required(),
        currentRound: yup.number().required(),
        creator: createStrapiEntitySchema(userBasicAttributesSchema).required(),
        positions: createStrapiCollectionSchema(
          yup.object({
            heading: yup.string().required(),
            description: yup.string().required(),
            author: createStrapiEntitySchema(userBasicAttributesSchema).required(),
            authorEmail: yup.string().email().required(),
            votes: yup.number().required(),
            voters: createStrapiCollectionSchema(userBasicAttributesSchema).required(),
            location: yup.mixed().nullable().default(null),
            intensity: yup.number().nullable().default(null),
            tags: createStrapiCollectionSchema(
              yup.object({
                name: yup.string().required()
              })
            ).required(),
            order: yup.number().required()
          })
        ).required(),
        participants: createStrapiCollectionSchema(userBasicAttributesSchema).required()
      })
    ).required()
  })
);

/**
 * Validation helper function that validates data and returns typed result
 * 
 * @param schema - Yup schema to validate against
 * @param data - Data to validate
 * @param options - Validation options
 * @returns Validated and typed data
 * @throws ValidationError if validation fails
 * 
 * @example
 * ```typescript
 * import { validateResponse, userProjectListResponseSchema } from '$lib/types/validation';
 * 
 * try {
 *   const validData = await validateResponse(
 *     userProjectListResponseSchema,
 *     apiResponse
 *   );
 *   // validData is now validated and typed
 * } catch (error) {
 *   console.error('Validation error:', error.message);
 * }
 * ```
 */
export async function validateResponse<T>(
  schema: yup.Schema<T>,
  data: unknown,
  options?: yup.ValidateOptions
): Promise<T> {
  return await schema.validate(data, {
    strict: false,
    abortEarly: false,
    stripUnknown: false,
    ...options
  });
}

/**
 * Synchronous validation helper function
 * 
 * @param schema - Yup schema to validate against
 * @param data - Data to validate
 * @param options - Validation options
 * @returns Validated and typed data
 * @throws ValidationError if validation fails
 * 
 * @example
 * ```typescript
 * import { validateResponseSync, userProjectListResponseSchema } from '$lib/types/validation';
 * 
 * try {
 *   const validData = validateResponseSync(
 *     userProjectListResponseSchema,
 *     apiResponse
 *   );
 *   // validData is now validated and typed
 * } catch (error) {
 *   console.error('Validation error:', error.message);
 * }
 * ```
 */
export function validateResponseSync<T>(
  schema: yup.Schema<T>,
  data: unknown,
  options?: yup.ValidateOptions
): T {
  return schema.validateSync(data, {
    strict: false,
    abortEarly: false,
    stripUnknown: false,
    ...options
  });
}

/**
 * Safe validation helper that returns a result object instead of throwing
 * 
 * @param schema - Yup schema to validate against
 * @param data - Data to validate
 * @returns Result object with success flag and data or errors
 * 
 * @example
 * ```typescript
 * import { safeValidate, userProjectListResponseSchema } from '$lib/types/validation';
 * 
 * const result = await safeValidate(userProjectListResponseSchema, apiResponse);
 * 
 * if (result.success) {
 *   console.log('Valid data:', result.data);
 * } else {
 *   console.error('Validation errors:', result.errors);
 * }
 * ```
 */
export async function safeValidate<T>(
  schema: yup.Schema<T>,
  data: unknown
): Promise<
  | { success: true; data: T; errors: null }
  | { success: false; data: null; errors: yup.ValidationError }
> {
  try {
    const validData = await validateResponse(schema, data);
    return { success: true, data: validData, errors: null };
  } catch (error) {
    if (error instanceof yup.ValidationError) {
      return { success: false, data: null, errors: error };
    }
    throw error;
  }
}

/**
 * Type guard function to check if data matches a schema
 * 
 * @param schema - Yup schema to validate against
 * @param data - Data to check
 * @returns True if data is valid, false otherwise
 * 
 * @example
 * ```typescript
 * import { isValidResponse, userProjectListResponseSchema } from '$lib/types/validation';
 * 
 * if (isValidResponse(userProjectListResponseSchema, apiResponse)) {
 *   // apiResponse is valid
 *   console.log('Data is valid');
 * } else {
 *   console.log('Data is invalid');
 * }
 * ```
 */
export function isValidResponse<T>(
  schema: yup.Schema<T>,
  data: unknown
): data is T {
  try {
    schema.validateSync(data);
    return true;
  } catch {
    return false;
  }
}

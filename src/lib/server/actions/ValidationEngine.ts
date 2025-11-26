/**
 * Validation Engine
 * 
 * Validates action parameters against their schema definitions.
 * Checks parameter types, required fields, and custom validation functions.
 * 
 * Validates: Requirements 1.2, 1.3
 */

import type { ParamSchema, ValidationResult } from './types.js';

/**
 * ValidationEngine class
 * 
 * Responsible for validating action parameters against their schema.
 * Provides detailed error messages for validation failures.
 */
export class ValidationEngine {
  /**
   * Validate parameters against a schema
   * 
   * @param params - The parameters to validate
   * @param schema - The parameter schema to validate against
   * @returns Validation result with success status and any errors
   */
  async validate(
    params: Record<string, any>,
    schema: ParamSchema
  ): Promise<ValidationResult> {
    const errors: string[] = [];
    
    // Check each parameter in the schema
    for (const [key, rules] of Object.entries(schema)) {
      // Check if required parameter is missing or undefined
      if (rules.required && (!(key in params) || params[key] === undefined)) {
        errors.push(`Missing required parameter: ${key}`);
        continue;
      }
      
      // If parameter is present and not undefined, validate it
      if (key in params && params[key] !== undefined) {
        const value = params[key];
        
        // Allow null values for optional parameters
        if (value === null && !rules.required) {
          continue;
        }
        
        // Type validation
        const typeError = this.validateType(key, value, rules.type);
        if (typeError) {
          errors.push(typeError);
          continue; // Skip custom validation if type is wrong
        }
        
        // Custom validation function
        if (rules.validate) {
          try {
            const isValid = rules.validate(value);
            if (!isValid) {
              const description = rules.description 
                ? `: ${rules.description}` 
                : '';
              errors.push(`Parameter ${key} failed custom validation${description}`);
            }
          } catch (error) {
            errors.push(
              `Parameter ${key} validation function threw an error: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
          }
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
  
  /**
   * Validate the type of a parameter value
   * 
   * @param paramName - Name of the parameter (for error messages)
   * @param value - The value to validate
   * @param expectedType - The expected type
   * @returns Error message if validation fails, null if valid
   */
  private validateType(
    paramName: string,
    value: any,
    expectedType: 'string' | 'number' | 'boolean' | 'array' | 'object'
  ): string | null {
    // Handle null values - they should be caught by required check
    if (value === null) {
      return `Parameter ${paramName} cannot be null`;
    }
    
    // Get actual type
    let actualType: string;
    if (Array.isArray(value)) {
      actualType = 'array';
    } else if (value === null) {
      actualType = 'null';
    } else {
      actualType = typeof value;
    }
    
    // Check if types match
    if (actualType !== expectedType) {
      return `Parameter ${paramName} must be of type ${expectedType}, got ${actualType}`;
    }
    
    return null;
  }
}


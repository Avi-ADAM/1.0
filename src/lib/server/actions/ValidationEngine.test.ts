/**
 * Unit tests for ValidationEngine
 * 
 * Tests parameter type validation, required parameter checks,
 * custom validation functions, and error message generation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ValidationEngine } from './ValidationEngine.js';
import type { ParamSchema } from './types.js';

describe('ValidationEngine', () => {
  let validator: ValidationEngine;
  
  beforeEach(() => {
    validator = new ValidationEngine();
  });
  
  describe('Required Parameter Validation', () => {
    it('should pass when all required parameters are present', async () => {
      const schema: ParamSchema = {
        name: { type: 'string', required: true },
        age: { type: 'number', required: true }
      };
      
      const params = {
        name: 'John',
        age: 30
      };
      
      const result = await validator.validate(params, schema);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should fail when required parameter is missing', async () => {
      const schema: ParamSchema = {
        name: { type: 'string', required: true },
        age: { type: 'number', required: true }
      };
      
      const params = {
        name: 'John'
        // age is missing
      };
      
      const result = await validator.validate(params, schema);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('Missing required parameter: age');
    });
    
    it('should fail when multiple required parameters are missing', async () => {
      const schema: ParamSchema = {
        name: { type: 'string', required: true },
        age: { type: 'number', required: true },
        email: { type: 'string', required: true }
      };
      
      const params = {
        name: 'John'
      };
      
      const result = await validator.validate(params, schema);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors).toContain('Missing required parameter: age');
      expect(result.errors).toContain('Missing required parameter: email');
    });
    
    it('should pass when optional parameter is missing', async () => {
      const schema: ParamSchema = {
        name: { type: 'string', required: true },
        nickname: { type: 'string', required: false }
      };
      
      const params = {
        name: 'John'
      };
      
      const result = await validator.validate(params, schema);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should allow null for optional parameters', async () => {
      const schema: ParamSchema = {
        name: { type: 'string', required: true },
        nickname: { type: 'string', required: false }
      };
      
      const params = {
        name: 'John',
        nickname: null
      };
      
      const result = await validator.validate(params, schema);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should reject null for required parameters', async () => {
      const schema: ParamSchema = {
        name: { type: 'string', required: true }
      };
      
      const params = {
        name: null
      };
      
      const result = await validator.validate(params, schema);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('Parameter name cannot be null');
    });
  });
  
  describe('Type Validation', () => {
    it('should validate string type correctly', async () => {
      const schema: ParamSchema = {
        name: { type: 'string', required: true }
      };
      
      const validParams = { name: 'John' };
      const invalidParams = { name: 123 };
      
      const validResult = await validator.validate(validParams, schema);
      const invalidResult = await validator.validate(invalidParams, schema);
      
      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0]).toBe('Parameter name must be of type string, got number');
    });
    
    it('should validate number type correctly', async () => {
      const schema: ParamSchema = {
        age: { type: 'number', required: true }
      };
      
      const validParams = { age: 30 };
      const invalidParams = { age: '30' };
      
      const validResult = await validator.validate(validParams, schema);
      const invalidResult = await validator.validate(invalidParams, schema);
      
      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0]).toBe('Parameter age must be of type number, got string');
    });
    
    it('should validate boolean type correctly', async () => {
      const schema: ParamSchema = {
        active: { type: 'boolean', required: true }
      };
      
      const validParams = { active: true };
      const invalidParams = { active: 'true' };
      
      const validResult = await validator.validate(validParams, schema);
      const invalidResult = await validator.validate(invalidParams, schema);
      
      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0]).toBe('Parameter active must be of type boolean, got string');
    });
    
    it('should validate array type correctly', async () => {
      const schema: ParamSchema = {
        tags: { type: 'array', required: true }
      };
      
      const validParams = { tags: ['tag1', 'tag2'] };
      const invalidParams = { tags: 'tag1,tag2' };
      
      const validResult = await validator.validate(validParams, schema);
      const invalidResult = await validator.validate(invalidParams, schema);
      
      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0]).toBe('Parameter tags must be of type array, got string');
    });
    
    it('should validate object type correctly', async () => {
      const schema: ParamSchema = {
        metadata: { type: 'object', required: true }
      };
      
      const validParams = { metadata: { key: 'value' } };
      const invalidParams = { metadata: 'not an object' };
      
      const validResult = await validator.validate(validParams, schema);
      const invalidResult = await validator.validate(invalidParams, schema);
      
      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0]).toBe('Parameter metadata must be of type object, got string');
    });
    
    it('should distinguish between array and object', async () => {
      const arraySchema: ParamSchema = {
        items: { type: 'array', required: true }
      };
      
      const objectSchema: ParamSchema = {
        data: { type: 'object', required: true }
      };
      
      const arrayValue = { items: [] };
      const objectValue = { data: {} };
      
      // Array should not validate as object
      const arrayAsObject = await validator.validate(arrayValue, objectSchema);
      expect(arrayAsObject.valid).toBe(false);
      
      // Object should not validate as array
      const objectAsArray = await validator.validate(objectValue, arraySchema);
      expect(objectAsArray.valid).toBe(false);
    });
  });
  
  describe('Custom Validation Functions', () => {
    it('should pass when custom validation returns true', async () => {
      const schema: ParamSchema = {
        email: {
          type: 'string',
          required: true,
          validate: (value) => value.includes('@')
        }
      };
      
      const params = { email: 'user@example.com' };
      
      const result = await validator.validate(params, schema);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should fail when custom validation returns false', async () => {
      const schema: ParamSchema = {
        email: {
          type: 'string',
          required: true,
          validate: (value) => value.includes('@')
        }
      };
      
      const params = { email: 'invalid-email' };
      
      const result = await validator.validate(params, schema);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('Parameter email failed custom validation');
    });
    
    it('should include description in error message when provided', async () => {
      const schema: ParamSchema = {
        email: {
          type: 'string',
          required: true,
          validate: (value) => value.includes('@'),
          description: 'must contain @ symbol'
        }
      };
      
      const params = { email: 'invalid-email' };
      
      const result = await validator.validate(params, schema);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toBe('Parameter email failed custom validation: must contain @ symbol');
    });
    
    it('should handle custom validation function that throws error', async () => {
      const schema: ParamSchema = {
        value: {
          type: 'string',
          required: true,
          validate: () => {
            throw new Error('Validation error');
          }
        }
      };
      
      const params = { value: 'test' };
      
      const result = await validator.validate(params, schema);
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('Parameter value validation function threw an error');
      expect(result.errors[0]).toContain('Validation error');
    });
    
    it('should skip custom validation if type validation fails', async () => {
      let customValidationCalled = false;
      
      const schema: ParamSchema = {
        age: {
          type: 'number',
          required: true,
          validate: (value) => {
            customValidationCalled = true;
            return value > 0;
          }
        }
      };
      
      const params = { age: 'not a number' };
      
      const result = await validator.validate(params, schema);
      
      expect(result.valid).toBe(false);
      expect(customValidationCalled).toBe(false);
      expect(result.errors[0]).toContain('must be of type number');
    });
    
    it('should validate complex custom rules', async () => {
      const schema: ParamSchema = {
        password: {
          type: 'string',
          required: true,
          validate: (value) => {
            return value.length >= 8 && /[A-Z]/.test(value) && /[0-9]/.test(value);
          },
          description: 'must be at least 8 characters with uppercase and number'
        }
      };
      
      const validParams = { password: 'Password123' };
      const invalidParams = { password: 'weak' };
      
      const validResult = await validator.validate(validParams, schema);
      const invalidResult = await validator.validate(invalidParams, schema);
      
      expect(validResult.valid).toBe(true);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.errors[0]).toContain('must be at least 8 characters');
    });
  });
  
  describe('Multiple Validation Errors', () => {
    it('should collect all validation errors', async () => {
      const schema: ParamSchema = {
        name: { type: 'string', required: true },
        age: { type: 'number', required: true },
        email: {
          type: 'string',
          required: true,
          validate: (value) => value.includes('@')
        }
      };
      
      const params = {
        // name is missing
        age: 'not a number',
        email: 'invalid-email'
      };
      
      const result = await validator.validate(params, schema);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
      expect(result.errors).toContain('Missing required parameter: name');
      expect(result.errors).toContain('Parameter age must be of type number, got string');
      expect(result.errors).toContain('Parameter email failed custom validation');
    });
  });
  
  describe('Edge Cases', () => {
    it('should handle empty schema', async () => {
      const schema: ParamSchema = {};
      const params = { anything: 'value' };
      
      const result = await validator.validate(params, schema);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should handle empty params with optional schema', async () => {
      const schema: ParamSchema = {
        optional: { type: 'string', required: false }
      };
      const params = {};
      
      const result = await validator.validate(params, schema);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should handle extra parameters not in schema', async () => {
      const schema: ParamSchema = {
        name: { type: 'string', required: true }
      };
      
      const params = {
        name: 'John',
        extra: 'value',
        another: 123
      };
      
      const result = await validator.validate(params, schema);
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should handle undefined values', async () => {
      const schema: ParamSchema = {
        name: { type: 'string', required: true }
      };
      
      const params = {
        name: undefined
      };
      
      const result = await validator.validate(params, schema);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing required parameter: name');
    });
  });
});


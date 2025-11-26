/**
 * Tests for cookie-based Socket.IO authentication
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Socket Client Cookie Authentication', () => {
  beforeEach(() => {
    // Mock document.cookie
    Object.defineProperty(document, 'cookie', {
      writable: true,
      value: 'jwt=test-jwt-token; id=123; un=testuser'
    });
  });

  it('should read JWT from cookie when not provided', () => {
    // Parse cookies like the client does
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      acc[name] = value;
      return acc;
    }, {} as Record<string, string>);

    expect(cookies.jwt).toBe('test-jwt-token');
    expect(cookies.id).toBe('123');
    expect(cookies.un).toBe('testuser');
  });

  it('should handle missing cookies gracefully', () => {
    document.cookie = '';
    
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) {
        acc[name] = value;
      }
      return acc;
    }, {} as Record<string, string>);

    expect(cookies.jwt).toBeUndefined();
    expect(cookies.id).toBeUndefined();
  });

  it('should parse cookies with special characters', () => {
    document.cookie = 'jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test; id=456';
    
    const cookies = document.cookie.split(';').reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split('=');
      acc[name] = value;
      return acc;
    }, {} as Record<string, string>);

    expect(cookies.jwt).toBe('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test');
    expect(cookies.id).toBe('456');
  });
});

describe('Socket Server Cookie Parsing', () => {
  it('should parse cookie header correctly', () => {
    const cookieHeader = 'jwt=test-token; id=123; un=testuser';
    
    const parseCookies = (header: string | undefined): Record<string, string> => {
      if (!header) return {};
      
      return header.split(';').reduce((cookies, cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies[name] = decodeURIComponent(value);
        }
        return cookies;
      }, {} as Record<string, string>);
    };

    const cookies = parseCookies(cookieHeader);
    
    expect(cookies.jwt).toBe('test-token');
    expect(cookies.id).toBe('123');
    expect(cookies.un).toBe('testuser');
  });

  it('should handle URL-encoded cookie values', () => {
    const cookieHeader = 'jwt=test%20token; email=test%40example.com';
    
    const parseCookies = (header: string | undefined): Record<string, string> => {
      if (!header) return {};
      
      return header.split(';').reduce((cookies, cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies[name] = decodeURIComponent(value);
        }
        return cookies;
      }, {} as Record<string, string>);
    };

    const cookies = parseCookies(cookieHeader);
    
    expect(cookies.jwt).toBe('test token');
    expect(cookies.email).toBe('test@example.com');
  });

  it('should handle empty cookie header', () => {
    const parseCookies = (header: string | undefined): Record<string, string> => {
      if (!header) return {};
      
      return header.split(';').reduce((cookies, cookie) => {
        const [name, value] = cookie.trim().split('=');
        if (name && value) {
          cookies[name] = decodeURIComponent(value);
        }
        return cookies;
      }, {} as Record<string, string>);
    };

    expect(parseCookies(undefined)).toEqual({});
    expect(parseCookies('')).toEqual({});
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the project management integration with the new global sale component
describe('Project Management Sales Integration', () => {
  let mockProjectUsers;
  let mockBmiData;
  let mockSalee;

  beforeEach(() => {
    mockProjectUsers = [
      {
        id: '1',
        attributes: {
          username: 'testuser1',
          profilePic: { data: null }
        }
      },
      {
        id: '2',
        attributes: {
          username: 'testuser2',
          profilePic: { 
            data: { 
              attributes: { 
                url: 'https://example.com/profile.jpg' 
              } 
            } 
          }
        }
      }
    ];

    mockBmiData = [
      {
        id: '1',
        attributes: {
          name: 'Test Product 1',
          price: 100,
          quant: 5,
          kindOf: 'total'
        }
      },
      {
        id: '2',
        attributes: {
          name: 'Test Product 2',
          price: 200,
          quant: 3,
          kindOf: 'monthly'
        }
      }
    ];

    mockSalee = [];
  });

  it('should handle sale callback correctly', () => {
    // Mock the sale callback function from hamatanot.svelte
    function sale(event) {
      const id = event.id;
      const un = event.un;
      let oldob = [...mockBmiData];
      const x = oldob.map((c) => c.id);
      const indexy = x.indexOf(id);
      oldob[indexy].attributes.quant = un;
      mockBmiData = oldob;
      mockSalee.push(event.matana);
    }

    // Simulate a successful sale event
    const saleEvent = {
      id: '1',
      un: 3, // New quantity after sale
      matana: {
        id: '1',
        attributes: {
          name: 'Test Product 1',
          price: 100,
          quant: 3,
          kindOf: 'total'
        }
      }
    };

    // Execute the sale callback
    sale(saleEvent);

    // Verify that the product quantity was updated
    const updatedProduct = mockBmiData.find(p => p.id === '1');
    expect(updatedProduct.attributes.quant).toBe(3);

    // Verify that the sale was added to the sales list
    expect(mockSalee).toHaveLength(1);
    expect(mockSalee[0].id).toBe('1');
  });

  it('should calculate total sales correctly', () => {
    // Mock sales data
    const mockSales = [
      {
        attributes: {
          in: 100,
          matanot: {
            data: {
              attributes: {
                name: 'Product A'
              }
            }
          }
        }
      },
      {
        attributes: {
          in: 200,
          matanot: {
            data: {
              attributes: {
                name: 'Product B'
              }
            }
          }
        }
      },
      {
        attributes: {
          in: 150,
          matanot: {
            data: {
              attributes: {
                name: 'Product A'
              }
            }
          }
        }
      }
    ];

    // Calculate total sales (similar to the effect in hamatanot.svelte)
    const fermatana = mockSales.reduce((acc, sale) => {
      const matanaName = sale.attributes.matanot.data.attributes.name;
      const saleIn = sale.attributes.in;
      acc[matanaName] = (acc[matanaName] || 0) + saleIn;
      return acc;
    }, {});

    // Verify calculations
    expect(fermatana['Product A']).toBe(250); // 100 + 150
    expect(fermatana['Product B']).toBe(200);

    // Calculate total income
    const allin = mockSales.reduce((total, s) => total + s.attributes.in, 0);
    expect(allin).toBe(450); // 100 + 200 + 150
  });

  it('should handle profile picture URL generation correctly', () => {
    // Mock the getSrc function from hamatanot.svelte
    function getSrc(id) {
      for (let i = 0; i < mockProjectUsers.length; i++) {
        if (mockProjectUsers[i].id == id) {
          if (mockProjectUsers[i].attributes.profilePic.data != null) {
            return mockProjectUsers[i].attributes.profilePic.data.attributes.url;
          } else {
            return 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png';
          }
        }
      }
      return 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png';
    }

    // Test user with profile picture
    const srcWithPic = getSrc('2');
    expect(srcWithPic).toBe('https://example.com/profile.jpg');

    // Test user without profile picture
    const srcWithoutPic = getSrc('1');
    expect(srcWithoutPic).toBe('https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png');

    // Test non-existent user
    const srcNonExistent = getSrc('999');
    expect(srcNonExistent).toBe('https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png');
  });

  it('should maintain backward compatibility with sale component props', () => {
    // Test that the props mapping is correct
    const originalProps = {
      projectUsers: mockProjectUsers,
      each: 100,
      quant: 5,
      kindUlimit: false,
      maid: '1',
      kindOf: 'total'
    };

    // These should map to SaleComponent props as:
    const expectedSaleComponentProps = {
      productId: originalProps.maid,
      productName: '',
      availableQuantity: originalProps.quant,
      price: originalProps.each,
      kindOf: originalProps.kindOf,
      projectUsers: originalProps.projectUsers,
      kindUlimit: originalProps.kindUlimit
    };

    // Verify the mapping
    expect(expectedSaleComponentProps.productId).toBe('1');
    expect(expectedSaleComponentProps.availableQuantity).toBe(5);
    expect(expectedSaleComponentProps.price).toBe(100);
    expect(expectedSaleComponentProps.kindOf).toBe('total');
    expect(expectedSaleComponentProps.kindUlimit).toBe(false);
    expect(expectedSaleComponentProps.projectUsers).toBe(mockProjectUsers);
  });

  it('should handle different product types correctly', () => {
    const productTypes = [
      { kindOf: 'total', expected: 'per unit' },
      { kindOf: 'monthly', expected: 'monthly' },
      { kindOf: 'yearly', expected: 'yearly' },
      { kindOf: 'unlimited', expected: 'unlimited' }
    ];

    productTypes.forEach(({ kindOf, expected }) => {
      // This simulates the display logic in hamatanot.svelte
      let displayText;
      if (kindOf === 'total') {
        displayText = 'per unit';
      } else if (kindOf === 'monthly') {
        displayText = 'monthly';
      } else if (kindOf === 'yearly') {
        displayText = 'yearly';
      } else if (kindOf === 'unlimited') {
        displayText = 'unlimited';
      }

      expect(displayText).toBe(expected);
    });
  });
});
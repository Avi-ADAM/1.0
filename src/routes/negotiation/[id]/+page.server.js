// src/routes/negotiation/[id]/+page.server.js
import { sendToSer } from '$lib/send/sendToSer.js';

export async function load({ params, fetch }) {
    const id = params.id;
    
    // אם זה ID חדש (0), נחזיר רק את ה-ID
    if (id === '0') {
      return {
        id: '0',
        isNew: true
      };
    }
  
    // נסה לטעון נתונים קיימים מהשרת
    try {
      const result = await sendToSer({ id }, '39GetNegotiation', 0, 0, false, fetch);
      
      if (result.errors) {
        console.error('GraphQL Errors:', result.errors);
        return {
          id,
          error: result.errors[0].message,
          isNew: false
        };
      }
  
      if (result.data?.negotiation?.data) {
        const negotiationData = result.data.negotiation.data;
        const attrs = negotiationData.attributes;
        
        return {
          id: negotiationData.id,
          isNew: false,
          negotiation: {
            id: negotiationData.id,
            topic: attrs.topic,
            description: attrs.description,
            status: attrs.status,
            maxRounds: attrs.maxRounds || 3,
            currentRound: attrs.currentRound || 1,
            createdBy: attrs.createdBy,
            createdByEmail: attrs.createdByEmail,
            createdAt: attrs.createdAt,
            updatedAt: attrs.updatedAt,
            positions: attrs.positions?.data?.map(pos => ({
              id: pos.id,
              heading: pos.attributes.heading,
              description: pos.attributes.description,
              author: pos.attributes.author,
              authorEmail: pos.attributes.authorEmail,
              votes: pos.attributes.votes || 0,
              voters: JSON.parse(pos.attributes.voters || '[]'),
              location: pos.attributes.location || 50,
              intensity: pos.attributes.intensity || 5,
              tags: JSON.parse(pos.attributes.tags || '[]'),
              order: pos.attributes.order || 1,
              createdAt: pos.attributes.createdAt,
              hover: false
            })) || [],
            participants: attrs.participants?.data?.map(p => ({
              id: p.id,
              username: p.attributes.username,
              email: p.attributes.email,
              joinedAt: p.attributes.joinedAt
            })) || []
          }
        };
      } else {
        return {
          id,
          error: 'דיון לא נמצא',
          isNew: false
        };
      }
    } catch (error) {
      console.error('Error loading negotiation:', error);
      return {
        id,
        error: 'שגיאה בטעינת הדיון',
        isNew: false
      };
    }
  }

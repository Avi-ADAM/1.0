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

        /** voters may be a JSON array (new schema) or a JSON string (legacy) */
        const parseVoters = (v) => {
          if (Array.isArray(v)) return v;
          if (typeof v === 'string') try { return JSON.parse(v); } catch { return []; }
          return [];
        };

        /** tags may be JSON array or JSON string */
        const parseTags = (v) => {
          if (Array.isArray(v)) return v;
          if (typeof v === 'string') try { return JSON.parse(v); } catch { return []; }
          return [];
        };

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
            // New fields
            visibility: attrs.visibility || 'private',
            shareToken: attrs.shareToken || null,
            isLocal: attrs.isLocal || false,
            scaleMin: attrs.scaleMin ?? 0,
            scaleMax: attrs.scaleMax ?? 100,
            places: attrs.places?.data?.map(p => ({ id: p.id, name: p.attributes.name })) || [],
            positions: attrs.positions?.data?.map(pos => ({
              id: pos.id,
              heading: pos.attributes.heading,
              description: pos.attributes.description,
              author: pos.attributes.author,
              authorEmail: pos.attributes.authorEmail,
              authorExternalId: pos.attributes.authorExternalId || null,
              authorType: pos.attributes.authorType || null,
              votes: pos.attributes.votes || 0,
              voters: parseVoters(pos.attributes.voters),
              location: pos.attributes.location || 50,
              intensity: pos.attributes.intensity || 5,
              tags: parseTags(pos.attributes.tags),
              order: pos.attributes.order || 1,
              isAnchor: pos.attributes.isAnchor || false,
              pole: pos.attributes.pole || 'none',
              kind: pos.attributes.kind || 'opinion',
              relativePlacement: pos.attributes.relativePlacement || null,
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

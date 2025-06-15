// src/routes/negotiation/[id]/+page.server.js
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
    const query = `
      query GetNegotiation($id: ID!) {
        negotiation(id: $id) {
          data {
            id
            attributes {
              topic
              description
              status
              maxRounds
              currentRound
              createdBy
              createdByEmail
              createdAt
              updatedAt
              positions {
                data {
                  id
                  attributes {
                    heading
                    description
                    author
                    authorEmail
                    votes
                    supporters
                    location
                    intensity
                    tags
                    order
                    createdAt
                  }
                }
              }
              participants {
                data {
                  id
                  attributes {
                    username
                    email
                    joinedAt
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        variables: { id }
      })
    });

    const result = await response.json();
    
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
            supporters: JSON.parse(pos.attributes.supporters || '[]'),
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
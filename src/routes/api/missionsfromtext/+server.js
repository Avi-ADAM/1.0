// src/routes/api/search.js
import { sendToSer } from '$lib/send/sendToSer.js';
import { json } from '@sveltejs/kit';

const OPENAI_API_KEY = import.meta.env.OPENAI;

async function analyzeText(text, predefinedMissions, fetch) {
  const prompt = `
    Analyze the following task and provide a set of mission IDs needed to accomplish it. If there are any new missions that need to be created, list them separately. Here are the existing missions:

    ${predefinedMissions.map((mission) => `ID: ${mission.id}, Title: ${mission.attributes.missionName}, Description: ${mission.attributes.descrip}`).join('\n')}

    Task: "${text}"

    Response format: {"existingMissionIds": ["id1", "id2"], "newMissions": [{"title": "New Mission 1", "description": "Description 1"},]}
  `;
    console.log(prompt)
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4-0613',
      messages: [{"role": "system","content":  prompt}],
      max_tokens: 2000,
    }),
  });

  const data = await response.json();
  console.log(data)
  console.log(data.choices[0])
  if (data && data.choices && data.choices.length > 0 ) {
    const content = data.choices[0];
    let x = JSON.parse(content.message.content);
    console.log(x)
    console.log(content); // Now this will log the parsed object
    return x;
  } else {
    // Handle the case where data is not in the expected format
    console.error('Unexpected API response:', data);
    return 'Error: Could not retrieve the content';
  }
}

export async function GET({ url, fetch }) {
  const text = url.searchParams.get('text');
  if (!text) {
    return json({ error: 'Text query parameter is required' }, { status: 400 });
  }

  try {
    // Fetch all existing missions from Strapi
    const strapiResponse = await sendToSer({},"12mission",null,null,true,fetch);
    const predefinedMissions = await strapiResponse.data.missions.data;
    console.log(predefinedMissions)
    // Analyze the text with predefined missions
    const analysis = await analyzeText(text, predefinedMissions,fetch);
    console.log("58:",analysis)
    let existingMissions = []
    // Fetch the existing missions based on the analysis result
    const missionIds = analysis.existingMissionIds
    const existingMissionsResponse = await sendToSer(
      { ids: missionIds },
      '13missionById',
      null,
      null,
      true,
      fetch
    ).then(d => existingMissions = d.data); //fetch(`${STRAPI_BASE_URL}/missions?filters[id][$in]=${missionIds}`);

    return json({
      existingMissions,
      newMissions: analysis.newMissions,
    });
  } catch (error) {
    return json({ error: error.message }, { status: 500 });
  }
}

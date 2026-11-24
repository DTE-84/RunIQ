import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { image_base64, platform } = req.body;

  if (!image_base64) {
    return res.status(400).json({ error: 'Missing image_base64 in request body' });
  }

  const systemPrompt = `You are looking at a screenshot of a gig delivery offer from a driver app (likely ${platform || 'Spark Driver'}).

Extract exactly what is visible on screen. Do not guess or invent numbers that aren't shown.

Your output MUST be ONLY a valid JSON object matching exactly this structure (use null for any field that is not visible in the screenshot):
{
  "platform": "Spark" | "DoorDash" | "UberEats" | "Instacart" | null,
  "pay": 22.50,
  "tips": 0.0,
  "miles": 8.2,
  "time_minutes": 25,
  "items": 15,
  "dropoff_zone": "Residential"
}

Notes:
- "pay" is the total payout/base pay shown for the offer.
- "tips" is only the tip amount if it is broken out separately; otherwise null.
- "miles" is the total delivery distance shown.
- "time_minutes" is the estimated time if shown, otherwise null.
- "items" is the number of items/stops/orders if shown.
- "dropoff_zone" is a short description of the delivery area/city if visible, otherwise null.`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: "image/jpeg",
                data: image_base64.replace(/^data:image\/\w+;base64,/, ''),
              },
            },
            {
              type: "text",
              text: systemPrompt
            }
          ],
        }
      ],
    });

    const content = response.content[0].text;
    let extractedData;

    try {
      extractedData = JSON.parse(content);
    } catch (e) {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        extractedData = JSON.parse(match[0]);
      } else {
        throw new Error("Failed to parse AI JSON output");
      }
    }

    return res.status(200).json({ success: true, data: extractedData });
  } catch (error) {
    console.error('Scan Offer Error:', error);
    return res.status(500).json({ error: 'Failed to scan screenshot.' });
  }
}

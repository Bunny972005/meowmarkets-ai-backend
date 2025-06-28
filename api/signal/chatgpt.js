export default async function handler(req, res) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OpenAI API Key" });
  }

  const prompt = `
You are a financial market assistant API. 
ONLY return a valid JSON object like this:
{ "signal": "Buy", "confidence": 87 }

Do not say anything else. Do not explain.

Here’s some sample market data:
"Bitcoin surges 4% after Fed hints at pause. Ethereum gains 6%."

Respond now:
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
        temperature: 0,
        max_tokens: 100,
      }),
    });

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "";

    // DEBUG: log full AI response to help us debug
    console.log("AI raw response:", aiResponse);

    // Try to extract JSON block
    const match = aiResponse.match(/\{[\s\S]*?\}/);
    if (!match) {
      return res.status(500).json({ error: "AI did not return JSON format." });
    }

    try {
      const json = JSON.parse(match[0]);
      return res.status(200).json(json);
    } catch (e) {
      return res.status(500).json({ error: "AI response was not valid JSON." });
    }
  } catch (err) {
    return res.status(500).json({ error: "OpenAI API call failed: " + err.message });
  }
}

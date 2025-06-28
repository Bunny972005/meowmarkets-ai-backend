export default async function handler(req, res) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OpenAI API Key" });
  }

  const prompt = `
You're a financial AI assistant. Based on the following news, return a trading signal.

News: "Bitcoin surges past $70K amid renewed institutional interest."

Respond ONLY in this format: { "signal": "Buy", "confidence": 87 }
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
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "";

    try {
      const parsed = JSON.parse(aiMessage);
      return res.status(200).json(parsed);
    } catch {
      return res.status(500).json({ error: "Could not parse AI response." });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

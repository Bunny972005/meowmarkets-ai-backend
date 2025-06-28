export default async function handler(req, res) {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "Missing OpenAI API Key" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-0613", // force version that supports functions
        messages: [
          {
            role: "user",
            content: "Generate a trading signal with a confidence score from current market conditions.",
          },
        ],
        temperature: 0,
        functions: [
          {
            name: "generate_signal",
            description: "Returns trading signal and confidence score",
            parameters: {
              type: "object",
              properties: {
                signal: {
                  type: "string",
                  enum: ["Buy", "Sell", "Hold"],
                  description: "Trading signal to follow",
                },
                confidence: {
                  type: "integer",
                  minimum: 0,
                  maximum: 100,
                  description: "Confidence level in percent",
                },
              },
              required: ["signal", "confidence"],
            },
          },
        ],
        function_call: { name: "generate_signal" },
      }),
    });

    const data = await response.json();

    const rawArgs = data.choices?.[0]?.message?.function_call?.arguments;

    if (!rawArgs) {
      console.error("Missing function_call.arguments:", data);
      return res.status(500).json({ error: "No function response from AI." });
    }

    const parsed = JSON.parse(rawArgs);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: "OpenAI API error: " + err.message });
  }
}

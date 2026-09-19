// Uses Google's Gemini API (free tier available via Google AI Studio) instead
// of Anthropic. Get a key at https://aistudio.google.com -> "Get API key".
const MODEL = "gemini-2.5-flash";

export async function askGemini(prompt) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    console.error("Gemini API error:", data);
    throw new Error(data?.error?.message || "AI generation failed");
  }
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  return text ? text.trim() : "";
}

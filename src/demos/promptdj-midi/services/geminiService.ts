import { GoogleGenAI, Type } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getInstrumentalStyles(prompt: string): Promise<string[]> {

  const fullPrompt = `
    Based on the following instrumental style prompt, generate a list of 4 to 8 adjustable styles that could be used to create the music.
    The styles should be concise and descriptive, suitable for use as labels for adjustable controls in a music generation application.
    Return the styles as a JSON array of strings.

    Prompt: "${prompt}"

    Example:
    Prompt: "A futuristic, cyberpunk-inspired track with a driving beat and atmospheric synths."
    Response:
    [
      "Driving Kick",
      "Atmospheric Pads",
      "Cybernetic Arpeggios",
      "Glitched Percussion",
      "Reverb-drenched Synths",
      "Sub-bass Drone"
    ]
  `;

  const result = await genAI.models.generateContent({
    model: "gemini-2.5-pro",
    contents: { parts: [{ text: fullPrompt }] },
  })
  
  const text = await result.text;

  try {
    const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      const styles = JSON.parse(jsonMatch[1]);
      return Array.isArray(styles) ? styles : [];
    }
    const styles = JSON.parse(text);
    return Array.isArray(styles) ? styles : [];
  } catch (error) {
    console.error("Error parsing Gemini response:", error);
    return [];
  }
}

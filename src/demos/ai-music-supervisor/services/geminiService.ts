import { GoogleGenAI, Type } from "@google/genai";
import { MusicBrief } from "../types";



console.log(process.env.API_KEY);
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

const musicBriefSchema = {
  type: Type.OBJECT,
  properties: {
    titleSuggestion: { type: Type.STRING, description: "A creative and fitting title for the music track." },
    overallMood: { type: Type.STRING, description: "A detailed description of the overall mood and feeling the music should evoke (e.g., 'epic, melancholic, hopeful')." },
    keyElements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of 3-5 key musical or thematic elements to focus on (e.g., 'Soaring strings', 'Minimalist piano', 'Glitchy electronic beats')."
    },
    tempo: { type: Type.STRING, description: "Suggested tempo, including BPM and a descriptive term (e.g., '120 BPM (Allegro)')." },
    instrumentation: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of recommended instruments (e.g., 'Orchestral Strings', 'Synthesizer Arps', 'Female Vocal Chops', '808 Bass')."
    },
    musicalCues: {
      type: Type.ARRAY,
      description: "If a script with timings is provided, list specific musical cues. Otherwise, describe 2-3 hypothetical moments in the piece.",
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: { type: Type.STRING, description: "Timestamp for the cue (e.g., '0:15-0:30') or a structural description (e.g., 'Intro', 'Chorus')." },
          description: { type: Type.STRING, description: "Description of the musical action at this cue (e.g., 'Music builds tension with a rising synth pad')." }
        },
        required: ["timestamp", "description"]
      }
    },
    negativeConstraints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "A list of elements or styles to avoid (e.g., 'No acoustic guitar', 'Avoid overly complex melodies')."
    }
  },
  required: ["titleSuggestion", "overallMood", "keyElements", "tempo", "instrumentation", "musicalCues", "negativeConstraints"]
};


export const generateMusicBrief = async (script: string, imageFile: File | null): Promise<MusicBrief> => {
  const parts: any[] = [
    { text: "You are an expert music supervisor and composer's assistant. Your task is to analyze the provided creative context (a script/description and/or an image) and generate a detailed, professional music brief. The brief should be structured and actionable for a composer. Follow the provided JSON schema precisely." },
  ];

  if (script) {
    parts.push({ text: `\n--- SCRIPT/DESCRIPTION ---\n${script}` });
  }

  if (imageFile) {
    const imagePart = await fileToGenerativePart(imageFile);
    parts.push(imagePart);
  }
  
  if (!script && !imageFile) {
    throw new Error("Please provide either a script or an image.");
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: parts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: musicBriefSchema,
        temperature: 0.8,
      },
    });

    const jsonText = response.text.trim();
    return JSON.parse(jsonText) as MusicBrief;

  } catch (error) {
    console.error("Error generating music brief from Gemini:", error);
    throw new Error("Failed to generate music brief. The AI model may be temporarily unavailable or the input could not be processed.");
  }
};
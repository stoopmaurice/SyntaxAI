
import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";
import { ChatMessage } from "../types.ts";

export async function* updateCodeStream(history: ChatMessage[], newPrompt: string, language: string) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY niet gevonden in process.env. Voeg deze toe aan je Netlify Environment Variables.");
  }
  
  const ai = new GoogleGenAI({ apiKey });

  const contents: Content[] = history.map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));

  const systemInstruction = `
    Je bent een wereldklasse software engineer met expertise in ALLE programmeertalen (Python, Lua, C++, Java, Rust, JS/TS, PHP, etc.).
    Doel: Wijzig het bestaande script op basis van de instructies van de gebruiker.
    
    RICHTLIJNEN:
    1. Lever ALTIJD de volledige, verbeterde code terug.
    2. Gebruik best practices voor de specifieke taal (${language}).
    3. Voeg duidelijke commentaren toe aan belangrijke wijzigingen.
    
    OUTPUT FORMAT:
    ${language}--
    [De volledige code hier]
  `;

  try {
    const stream = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: [...contents, { role: 'user', parts: [{ text: newPrompt }] }],
      config: { 
        systemInstruction, 
        temperature: 0.2,
      },
    });

    for await (const chunk of stream) {
      yield (chunk as GenerateContentResponse).text;
    }
  } catch (error) {
    console.error("Gemini Update Error:", error);
    throw error;
  }
}

export async function* generateCodeStream(language: string, requirement: string) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY niet gevonden in process.env. Voeg deze toe aan je Netlify Environment Variables.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const systemInstruction = `
    Je bent een master programmeur. Je kunt scripts schrijven voor elk platform en elke taal (Lua, Python, C++, etc.).
    Taal: ${language}
    
    INSTRUCTIES:
    - Schrijf functionele, schone en veilige code.
    - Geen introductie tekst, alleen de code.
    - Gebruik het formaat: TaalNaam--[Code]
    
    RICHTLIJNEN:
    - Voor Lua: Focus op efficiëntie (geschikt voor bijv. Roblox of FiveM indien gevraagd).
    - Voor Python: Gebruik PEP8 standaarden.
    - Voor C++: Gebruik moderne standaarden (C++17 of hoger).
  `;

  try {
    const stream = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [{ text: requirement }] }],
      config: { 
        systemInstruction, 
        temperature: 0.4,
      },
    });

    for await (const chunk of stream) {
      yield (chunk as GenerateContentResponse).text;
    }
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
}

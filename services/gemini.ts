
import { GoogleGenAI, GenerateContentResponse, Content } from "@google/genai";
import { ChatMessage } from "../types.ts";

// Fix: Access API_KEY directly within functions to ensure the most current key is used.
export async function* updateCodeStream(history: ChatMessage[], newPrompt: string, language: string) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API key is missing.");
  const ai = new GoogleGenAI({ apiKey: apiKey });

  const contents: Content[] = history.map(m => ({
    role: m.role,
    parts: [{ text: m.text }]
  }));

  const systemInstruction = `
    You are an expert polyglot software engineer.
    The user wants to modify their existing ${language} script.
    
    GUIDELINES:
    1. Analyze the current code in the conversation history.
    2. Apply the requested changes (fixes, additions, or optimizations).
    3. IMPORTANT: Always provide the COMPLETE updated script, not just snippets.
    4. Maintain comments and best practices.
    
    OUTPUT FORMAT:
    ${language}--
    [Updated Code Only]
  `;

  try {
    const stream = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: [
        ...contents,
        { role: 'user', parts: [{ text: newPrompt }] }
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
      },
    });

    for await (const chunk of stream) {
      const response = chunk as GenerateContentResponse;
      yield response.text;
    }
  } catch (error) {
    console.error("Gemini Update Error:", error);
    throw error;
  }
}

export async function* generateCodeStream(language: string, requirement: string) {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API key is missing.");
  const ai = new GoogleGenAI({ apiKey: apiKey });
  
  const systemInstruction = `
    You are an expert polyglot software engineer. 
    Task: Generate a high-quality script in "${language}".
    
    OUTPUT FORMAT:
    LanguageName--
    [Code Here]
    
    RULES:
    1. Start with the language name followed by '--'.
    2. Provide functional, clean, and well-commented code.
    3. Do not include introductory text, only the code.
  `;

  try {
    const stream = await ai.models.generateContentStream({
      model: 'gemini-3-pro-preview',
      contents: [{ parts: [{ text: requirement }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      },
    });

    for await (const chunk of stream) {
      const response = chunk as GenerateContentResponse;
      yield response.text;
    }
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
}

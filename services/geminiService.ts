import { GoogleGenAI, Type } from "@google/genai";
import { DiagramAnalysisResponse } from "../types";

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

export const validateApiKey = async (apiKey: string): Promise<boolean> => {
  if (!apiKey) return false;
  try {
    const ai = new GoogleGenAI({ apiKey });
    // Use a lightweight model and a minimal prompt to validate the key
    // This is a fast and cost-effective way to check for authentication errors.
    await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'h'
    });
    return true;
  } catch (error) {
    console.error("API Key validation failed:", error);
    return false;
  }
};


export const analyzeDiagram = async (imageFile: File, apiKey: string): Promise<DiagramAnalysisResponse> => {
  if (!apiKey) {
    throw new Error("API Key is missing. Please provide a valid key.");
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const imagePart = await fileToGenerativePart(imageFile);
    
    const textPart = {
      text: `You are an expert computer vision system specializing in technical diagram deconstruction. Your task is to analyze the provided physics diagram and break it down into a structured list of primitive components. Your output MUST be a JSON object that precisely describes each element's geometric and visual properties.

**Core Mission:** Convert the visual information into a structured, machine-readable format. Accuracy is paramount.

**Analysis & Deconstruction Process:**

1.  **Establish Coordinate System:** Define a \`viewBox\` that encapsulates the entire diagram. The top-left corner is (0,0).
2.  **Identify Components:** Scan the image and identify all distinct components: rectangles (blocks), complex shapes (ramps, vectors), and text labels.
3.  **Extract Properties:** For EACH component, you must extract the following properties with the highest possible precision:
    *   \`id\`: A unique, descriptive identifier (e.g., "block-1", "ramp", "velocity-vector").
    *   \`type\`: The component's primitive type ('RECT', 'PATH', 'TEXT').
    *   \`x\`, \`y\`: The coordinates of the component's top-left corner within the viewBox.
    *   \`width\`, \`height\`: The dimensions of the component's bounding box.
    *   \`rotation\`: The rotation of the component in degrees around its center. This is CRITICAL for ramps and vectors.
    *   \`fill\`: The fill color, sampled directly from the source image.
    *   \`stroke\`: The stroke (outline) color, sampled directly from the source image.
    *   \`strokeWidth\`: The width of the stroke.
    *   \`text\`: (For 'TEXT' type only) The exact text content.
    *   \`path\`: (For 'PATH' type only) The SVG path data string (e.g., "M 0 0 L 100 50 H 0 Z").

**Final Output:** Your response must be a single JSON object matching the provided schema, containing the viewBox dimensions and a \`components\` array. Each element in the array is an object representing one component from the diagram.`,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts: [textPart, imagePart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            viewBox: {
                type: Type.OBJECT,
                properties: {
                    width: { type: Type.NUMBER },
                    height: { type: Type.NUMBER },
                },
                required: ['width', 'height']
            },
            components: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  type: { type: Type.STRING, enum: ['RECT', 'PATH', 'TEXT'] },
                  x: { type: Type.NUMBER },
                  y: { type: Type.NUMBER },
                  width: { type: Type.NUMBER },
                  height: { type: Type.NUMBER },
                  rotation: { type: Type.NUMBER },
                  fill: { type: Type.STRING },
                  stroke: { type: Type.STRING },
                  strokeWidth: { type: Type.NUMBER },
                  text: { type: Type.STRING },
                  path: { type: Type.STRING },
                },
                required: ['id', 'type', 'x', 'y', 'width', 'height', 'rotation', 'fill', 'stroke', 'strokeWidth']
              }
            }
          },
          required: ['viewBox', 'components']
        }
      }
    });

    const jsonText = response.text.trim();
    const parsedResponse: DiagramAnalysisResponse = JSON.parse(jsonText);

    if (!parsedResponse.components || !Array.isArray(parsedResponse.components)) {
      throw new Error("AI response did not contain a valid components array.");
    }
    
    return parsedResponse;
  } catch (error) {
    console.error("Error analyzing diagram with Gemini API:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during analysis.";
    throw new Error(`Failed to analyze diagram. ${errorMessage}`);
  }
};
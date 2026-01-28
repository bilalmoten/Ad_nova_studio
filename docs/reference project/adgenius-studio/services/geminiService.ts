
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { ConceptIdea, StoryboardScene } from "../types";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateConcepts = async (prompt: string, imageBase64?: string): Promise<ConceptIdea[]> => {
  const ai = getAIClient();
  const contents = imageBase64 
    ? { 
        parts: [
          { text: `Based on this description and image, generate 3 unique ad concepts: ${prompt}` },
          { inlineData: { data: imageBase64.split(',')[1], mimeType: 'image/png' } }
        ] 
      }
    : `Generate 3 unique ad concepts for this brief: ${prompt}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            hook: { type: Type.STRING },
            visualStyle: { type: Type.STRING }
          },
          required: ['title', 'description', 'hook', 'visualStyle']
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};

export const generateHeroImage = async (concept: ConceptIdea): Promise<string> => {
  const ai = getAIClient();
  const prompt = `Create a stunning high-fidelity ad hero image for: ${concept.title}. 
                  Visual style: ${concept.visualStyle}. 
                  Description: ${concept.description}. 
                  Ensure the composition is professional, clean, and commercial-grade.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-image-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      imageConfig: { aspectRatio: "16:9", imageSize: "1K" }
    }
  });

  let imageUrl = '';
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      break;
    }
  }
  return imageUrl;
};

export const generateStoryboardPlan = async (concept: ConceptIdea, shotCount: number): Promise<StoryboardScene[]> => {
  const ai = getAIClient();
  const prompt = `Create a ${shotCount}-shot storyboard for the ad concept: ${concept.title}.
                  Style: ${concept.visualStyle}.
                  Detail exactly what happens in each scene, including camera movement and start/end frame visual descriptions.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            shotNumber: { type: Type.NUMBER },
            description: { type: Type.STRING },
            startFrameDesc: { type: Type.STRING },
            endFrameDesc: { type: Type.STRING },
            duration: { type: Type.STRING }
          },
          required: ['shotNumber', 'description', 'startFrameDesc', 'endFrameDesc', 'duration']
        }
      }
    }
  });

  return JSON.parse(response.text || '[]');
};

export const generateShotVideo = async (scene: StoryboardScene, heroImage?: string): Promise<string> => {
  const ai = getAIClient();
  
  const prompt = `Animate the following scene: ${scene.description}. 
                  Visual transition from: ${scene.startFrameDesc} to: ${scene.endFrameDesc}.
                  Keep the style consistent with high-end commercial cinematography.`;

  let operationParams: any = {
    model: 'veo-3.1-fast-generate-preview',
    prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  };

  if (heroImage) {
    operationParams.image = {
      imageBytes: heroImage.split(',')[1],
      mimeType: 'image/png'
    };
  }

  let operation = await ai.models.generateVideos(operationParams);

  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 8000));
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
  const res = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
  const blob = await res.blob();
  return URL.createObjectURL(blob);
};

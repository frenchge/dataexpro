
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractionRecord, ColumnDefinition } from "../types";

// Initialize with process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const extractContent = async (
  content: string,
  isPDF: boolean,
  userPrompt: string,
  columns: ColumnDefinition[]
): Promise<ExtractionRecord[]> => {
  // Use gemini-3-pro-preview for complex technical reasoning and extraction tasks
  const model = 'gemini-3-pro-preview';
  
  // Construct a specific schema based on user-defined columns with detailed descriptions
  const columnHints: Record<string, string> = {
    marque_moto: "Motorcycle brand/manufacturer (e.g., Yamaha, Honda, KTM)",
    modele_moto: "Motorcycle model name (e.g., YZ250F, CRF450R)",
    annee_moto: "Motorcycle year (e.g., 2024)",
    marque_fourche: "Fork brand/manufacturer (e.g., KYB, Showa, WP)",
    modele_fourche: "Fork model name (e.g., SSS, SFF-Air, XACT)",
    comp_fourche: "Fork compression damping setting (clicks, turns, or value)",
    rebond_fourche: "Fork rebound damping setting (clicks, turns, or value)",
    ressort_fourche: "Fork spring rate or spring specification (e.g., 4.8 N/mm, 0.47 kg/mm)",
    marque_amortisseur: "Rear shock brand/manufacturer (e.g., KYB, Showa, WP)",
    modele_amortisseur: "Rear shock model name",
    comp_hv_amorto: "Rear shock high-speed compression damping setting",
    comp_bv_amorto: "Rear shock low-speed compression damping setting",
    detente_amorto: "Rear shock rebound/détente damping setting",
    ressort_amorto: "Rear shock spring rate (e.g., 52 N/mm, 5.3 kg/mm)",
    sag: "Static sag measurement (e.g., 105mm, 30%)",
  };
  
  const properties: Record<string, any> = {};
  const propertyOrdering: string[] = [];

  columns.forEach(col => {
    properties[col.id] = {
      type: Type.STRING,
      description: columnHints[col.id] || `The extracted value for ${col.header}. Extract this value thoroughly from the document.`,
    };
    propertyOrdering.push(col.id);
  });

  const responseSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: properties,
      propertyOrdering: propertyOrdering,
    },
  };

  // Build a detailed column description list for the AI
  const columnDescriptions = columns.map(col => `- "${col.id}" (${col.header})`).join('\n');

  const prompt = `
You are an expert data extraction assistant. Your job is to extract ALL structured data from the provided ${isPDF ? 'PDF document' : 'text content'} and fill in EVERY column as completely as possible.

User instructions: ${userPrompt}

Here are the columns to extract:
${columnDescriptions}

CRITICAL RULES:
1. You MUST attempt to fill EVERY column for each record. Do NOT leave columns empty if the information exists anywhere in the document.
2. For suspension settings, look for values like: clicks, turns, mm, N/mm, kg/mm, bar, psi, percentage, spring rates, preload, etc.
3. "Comp." means compression damping (clicks or turns). "Rebond" or "Détente" means rebound damping. "Ressort" means spring rate. "SAG" means static sag measurement.
4. "HV" means high-speed compression, "BV" means low-speed compression.
5. Look for data in tables, spec sheets, technical paragraphs, setting recommendations, and any structured or semi-structured format.
6. If multiple configurations or setups are mentioned, create a separate record for each one.
7. Include units when present (e.g., "12 clicks", "5.0 N/mm", "30%").
8. Only use an empty string if the information is truly not present in the document.

Structure the output as a JSON array of objects with the exact column IDs listed above.
  `;

  try {
    let response;
    if (isPDF) {
      // Content is expected to be a base64 string for PDFs
      response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            { inlineData: { data: content, mimeType: 'application/pdf' } },
            { text: prompt }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });
    } else {
      response = await ai.models.generateContent({
        model,
        contents: {
          parts: [{ text: `${prompt}\n\nCONTENT:\n${content}` }]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: responseSchema,
        }
      });
    }

    const resultText = response.text?.trim();
    if (!resultText) throw new Error("No data returned from AI");
    
    const parsedData = JSON.parse(resultText);
    
    // Add unique IDs to each record
    return (parsedData as any[]).map((item, index) => ({
      id: `rec-${Date.now()}-${index}`,
      ...item
    }));
  } catch (error: any) {
    console.error("Extraction failed:", error);
    throw new Error(error.message || "Failed to extract content");
  }
};

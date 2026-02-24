
import { GoogleGenAI, Type } from "@google/genai";
import { ExtractionRecord, ColumnDefinition } from "../types";

// Initialize with process.env.API_KEY directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Column hints shared across all extraction functions
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

export const extractContent = async (
  content: string,
  isPDF: boolean,
  userPrompt: string,
  columns: ColumnDefinition[]
): Promise<ExtractionRecord[]> => {
  // Use gemini-3-pro-preview for complex technical reasoning and extraction tasks
  const model = 'gemini-3-pro-preview';
  
  // Construct a specific schema based on user-defined columns with detailed descriptions
  
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

  // Detect HTML content for smarter prompting
  const isHtmlContent = !isPDF && /<html|<body|<table|<div\s/i.test(content);
  const contentTypeLabel = isPDF ? 'PDF document' : (isHtmlContent ? 'HTML webpage' : 'text content');

  const prompt = `
You are an expert data extraction assistant. Your job is to extract ALL structured data from the provided ${contentTypeLabel} and fill in EVERY column as completely as possible.
${isHtmlContent ? `
CRITICAL HTML PARSING INSTRUCTIONS:
- The content below is RAW HTML from a webpage. Parse the HTML structure meticulously.
- Look for data inside <table>, <tr>, <td>, <th> elements — suspension specs are almost always in HTML tables.
- Also check <div>, <span>, <li>, <dd>, <dt> elements and their text content.
- Look at class names and data attributes for context about what each value represents.
- Parse EVERY table and structured element completely before generating your response.
- Do NOT skip any table rows or cells — each row may represent a different motorcycle configuration.
` : ''}
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

// Detect if a string looks like a URL
export const isUrl = (text: string): boolean => {
  const trimmed = text.trim();
  return /^https?:\/\//i.test(trimmed) && !trimmed.includes('\n');
};

// Fetch URL content with multiple proxy fallbacks and retries
// Returns lightly cleaned HTML (scripts/styles removed, structure preserved)
export const fetchUrlContent = async (url: string): Promise<string> => {
  const proxies = [
    (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  ];

  let lastError: Error | null = null;

  for (const makeProxy of proxies) {
    try {
      const proxyUrl = makeProxy(url);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

      const response = await fetch(proxyUrl, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) {
        lastError = new Error(`Proxy returned ${response.status}`);
        continue;
      }

      const html = await response.text();
      // Light cleaning: strip scripts/styles but keep ALL HTML structure intact
      // Gemini parses HTML tables/divs far better than regex-stripped text
      let cleaned = html.replace(/<script[\s\S]*?<\/script>/gi, '');
      cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '');

      if (cleaned.length > 500) {
        // Truncate to 150K if very large (Gemini handles large context)
        return cleaned.length > 150000 ? cleaned.substring(0, 150000) : cleaned;
      }

      lastError = new Error('Fetched content too short, page may not have loaded');
    } catch (err: any) {
      lastError = err;
    }
  }

  throw new Error(`Failed to fetch URL content after trying all proxies: ${lastError?.message}`);
};

// Extract directly from a URL using Gemini with Google Search grounding.
// This is the PRIMARY strategy for URLs — Google's servers handle JS rendering,
// cookies, and complex pages that CORS proxies cannot.
export const extractFromUrl = async (
  url: string,
  userPrompt: string,
  columns: ColumnDefinition[]
): Promise<ExtractionRecord[]> => {
  const model = 'gemini-3-pro-preview';

  const columnDescriptions = columns.map(col => {
    const hint = columnHints[col.id] || col.header;
    return `- "${col.id}": ${hint}`;
  }).join('\n');

  const prompt = `You are an expert motorcycle suspension data extraction assistant.

Access and thoroughly analyze the content at this URL: ${url}

${userPrompt}

Extract these columns for EACH motorcycle/configuration found on the page:
${columnDescriptions}

CRITICAL RULES:
1. You MUST fill EVERY column for each record. Do NOT leave fields empty if the information exists anywhere on the page.
2. For suspension settings, look for: clicks, turns, mm, N/mm, kg/mm, bar, psi, spring rates, preload, sag values.
3. "Comp." = compression damping. "Rebond"/"Détente" = rebound. "Ressort" = spring rate. "SAG" = static sag.
4. "HV" = high-speed compression, "BV" = low-speed compression.
5. Include units when present (e.g., "13 clics", "5.0 N/mm", "105mm").
6. Create a separate record for each bike/configuration mentioned.
7. Only use "" if data truly does not exist on the page.

Return ONLY a raw JSON array of objects with the exact column IDs listed above.
Example: [{"marque_moto": "Honda", "modele_moto": "CRF450R", "annee_moto": "2024", ...}]`;

  const response = await ai.models.generateContent({
    model,
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    }
  });

  const text = response.text?.trim() || '';
  // Extract JSON array from response (may be wrapped in markdown code blocks)
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No structured data could be extracted from the URL");

  const parsed = JSON.parse(jsonMatch[0]);
  return (parsed as any[]).map((item, index) => ({
    id: `rec-${Date.now()}-${index}`,
    ...item
  }));
};

// Re-extract data for a specific record from its stored source content
export const reExtractForRecord = async (
  sourceContent: string,
  columns: ColumnDefinition[],
  existingRecord: Record<string, string>
): Promise<Record<string, string>> => {
  // Find which fields are empty
  const emptyFields = columns.filter(
    col => !existingRecord[col.id] || String(existingRecord[col.id]).trim() === ''
  );

  if (emptyFields.length === 0) {
    return {}; // Nothing to fill
  }

  const bikeContext = [
    existingRecord.marque_moto,
    existingRecord.modele_moto,
    existingRecord.annee_moto,
  ].filter(Boolean).join(' ');

  const prompt = `Re-extract data for the dirtbike: ${bikeContext}. Focus especially on filling these fields that are currently empty: ${emptyFields.map(f => f.header).join(', ')}. Extract ALL available information from the content.`;

  // Detect base64-encoded PDFs and extract as PDF binary
  const isBase64Pdf = sourceContent.startsWith('data:application/pdf;base64,');
  const content = isBase64Pdf ? sourceContent.slice('data:application/pdf;base64,'.length) : sourceContent;

  const records = await extractContent(content, isBase64Pdf, prompt, columns);

  if (records.length === 0) return {};

  // Return only the fields that were empty and now have values
  const result: Record<string, string> = {};
  for (const field of emptyFields) {
    const value = records[0][field.id];
    if (value && String(value).trim()) {
      result[field.id] = String(value);
    }
  }

  return result;
};

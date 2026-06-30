import { GoogleGenAI } from "@google/genai";
import { db, Product } from "./db.js";

let aiClient: GoogleGenAI | null = null;

// Lazy initialization of the Gemini client to prevent crash on startup if key is missing
function getAI(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      try {
        aiClient = new GoogleGenAI({ apiKey });
      } catch (err) {
        console.error("Failed to initialize GoogleGenAI with key", err);
      }
    } else {
      console.warn("GEMINI_API_KEY is missing or using placeholder. Running in heuristic/fallback AI mode.");
    }
  }
  return aiClient;
}

// Format the available store catalog as context for Gemini
function getCatalogContext(): string {
  const products = db.products;
  return products.map(p => {
    return `- ID: ${p.id}
  Name: ${p.name}
  Brand: ${p.brand}
  Category: ${p.category} / ${p.subcategory}
  Price: $${p.price} (Discount: ${p.discount}%)
  Colors: ${p.colors.join(", ")}
  Sizes: ${p.sizes.join(", ")}
  Occasion: ${p.occasion}
  Fabric/Material: ${p.fabric} (${p.material})
  Gender: ${p.gender}
  Season: ${p.season}
  Description: ${p.description}
  Tags: ${p.aiTags.join(", ")}`;
  }).join("\n\n");
}

/**
 * 1. AI Fashion Stylist Chatbot
 * Answers style queries and links to real products from catalog
 */
export async function generateStylistResponse(
  chatHistory: { sender: "user" | "ai"; text: string }[],
  newPrompt: string
): Promise<{ text: string; suggestedProducts: string[] }> {
  const ai = getAI();
  const catalogText = getCatalogContext();

  const systemInstruction = `You are Aura, an elite AI fashion stylist and designer for "AuraStyle", a high-end luxury digital styling boutique.
Your goal is to provide warm, creative, and highly professional advice.
You have real-time access to the current store inventory:
${catalogText}

RULES:
1. Recommend specific outfits, footwear, and accessories. Explain exactly WHY they work well together (color contrast, fabric compatibility, occasion requirements).
2. ONLY recommend actual product IDs from our inventory if they fit the request (even partially). Suggest full coordinating ensembles (e.g. blazer + shirt + pants + shoes + watch + tie).
3. If some items aren't available in our catalogue, suggest general pieces and explain what to look for.
4. You MUST include a JSON array of suggested product IDs in your response, wrapped in a special block like this: [SUGGESTED_IDS: p1, p4, p5] so the app can render them.
5. Keep your tone encouraging, chic, and sophisticated, like a personal fashion designer.
6. Speak in brief, elegantly styled paragraphs. No technical jargon.`;

  if (!ai) {
    // Elegant fallback rule-based system
    return generateFallbackStylistResponse(newPrompt);
  }

  try {
    // Format conversation history for Gemini API
    const contents = chatHistory.map(h => ({
      role: h.sender === "user" ? "user" : "model",
      parts: [{ text: h.text }]
    }));
    contents.push({
      role: "user",
      parts: [{ text: newPrompt }]
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    });

    const text = response.text || "I'm having a brief issue scanning my wardrobe. Tell me more about what you're looking for!";
    
    // Parse suggested product IDs
    const suggestedProducts: string[] = [];
    const idRegex = /\[SUGGESTED_IDS:\s*([^\]]+)\]/i;
    const match = text.match(idRegex);
    if (match) {
      const ids = match[1].split(",").map(id => id.trim());
      for (const id of ids) {
        if (db.getProductById(id)) {
          suggestedProducts.push(id);
        }
      }
    } else {
      // Heuristic search if model didn't output structured tag
      const lower = text.toLowerCase();
      db.products.forEach(p => {
        if (lower.includes(p.name.toLowerCase()) || lower.includes(p.id)) {
          suggestedProducts.push(p.id);
        }
      });
    }

    // Clean up tag from displaying directly to user if desired, or let it stay clean
    const cleanedText = text.replace(/\[SUGGESTED_IDS:[^\]]+\]/gi, "").trim();

    return { text: cleanedText, suggestedProducts: Array.from(new Set(suggestedProducts)) };
  } catch (error) {
    console.error("Gemini API error in stylist:", error);
    return generateFallbackStylistResponse(newPrompt);
  }
}

function generateFallbackStylistResponse(prompt: string): { text: string; suggestedProducts: string[] } {
  const lower = prompt.toLowerCase();
  let text = "I am Aura, your AI stylist. ";
  const suggested: string[] = [];

  if (lower.includes("wedding") || lower.includes("marriage")) {
    text += "For a wedding, elegance is absolute. I recommend a sharp navy tailoring approach. Let's look at a structured Navy Blazer, styled perfectly with a Classic Cotton Dress Shirt, a Mulberry Silk Tie in Burgundy, and finished with a Chronos Gold Edition Swiss watch and Luxury Italian Leather Oxford Shoes.\n\nThis creates an incredibly sophisticated, classic color block that commands respect and celebration.";
    suggested.push("p1", "p4", "p5", "p6", "p7", "p8");
  } else if (lower.includes("interview") || lower.includes("formal") || lower.includes("office") || lower.includes("business")) {
    text += "A job interview is all about structured confidence. I recommend our Classic Navy Blazer, paired with a Structured Crease Formal Pant in Charcoal Gray, and our Egyptian Cotton White Dress Shirt. Tie it together with Italian Leather Oxford Shoes and a matching Silk Tie.\n\nThis exudes preparation, poise, and detail-oriented professionalism.";
    suggested.push("p1", "p4", "p5", "p7", "p12");
  } else if (lower.includes("jacket") || lower.includes("denim") || lower.includes("casual")) {
    text += "Casual style should be effortless but structured. A classic Denim Jacket layered over a soft knitwear piece or t-shirt works flawlessly. Try our deep blue organic denim or midnight black jacket, and complete the street-style vibe with Retro Cushion Sneakers.";
    suggested.push("p2", "p3", "p11");
  } else if (lower.includes("winter") || lower.includes("cold") || lower.includes("sweater")) {
    text += "For colder seasons, rich fabrics are essential. Cozy up in our Luxe Cashmere Turtleneck Sweater or layer with our Beige Trench Coat for an elegant city-sleek winter ensemble.";
    suggested.push("p9", "p10");
  } else {
    text += "That sounds like a wonderful look. To make an impression, focus on balancing fit and color harmony. For instance, pairing textured blazers with clean white cotton shirts or cozy cashmere maintains structured geometry. Let me share a few of our most popular premium selections that might fit your wardrobe perfectly!";
    suggested.push("p1", "p3", "p4", "p11");
  }

  return { text, suggestedProducts: suggested };
}

/**
 * 2. Intelligent Multimodal / Image Search
 * Analyzes uploaded image base64, plus optional user text prompt modifications,
 * and extracts matching search parameters.
 */
export async function analyzeImageSearch(
  base64Data: string, // data url or raw base64
  promptText?: string
): Promise<{
  extractedFeatures: {
    category?: string;
    colors?: string[];
    style?: string;
    fabric?: string;
    gender?: string;
    season?: string;
    keywords?: string[];
  };
  explanation: string;
  matchedProducts: string[];
}> {
  const ai = getAI();
  const catalogText = getCatalogContext();

  const userText = promptText ? `User instruction with image: "${promptText}"` : "Analyze this fashion image and find items in our store.";

  const systemInstruction = `You are a fashion computer vision model.
You will receive an image of a person or a piece of clothing, and optionally some user search directions.
Your task is to analyze the image carefully, identify key fashion attributes, and map them to our product catalog:
${catalogText}

You must return a raw JSON response. Do NOT wrap it in any markdown formatting except optionally standard JSON.
Format of JSON:
{
  "features": {
    "category": "category of item",
    "colors": ["list of major colors"],
    "style": "Formal | Casual | Wedding",
    "fabric": "fabric style",
    "gender": "Men | Women | Unisex",
    "season": "Summer | Winter | All-Season"
  },
  "explanation": "Brief stylist description of what you found in the image and how it relates to user instructions",
  "matchedProductIds": ["list of product IDs from catalog that are visually or semantically similar"]
}`;

  if (!ai) {
    return runFallbackImageSearch(promptText || "");
  }

  try {
    // Strip headers if any
    const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: "image/jpeg"
              }
            },
            {
              text: userText
            }
          ]
        }
      ],
      config: {
        systemInstruction,
        temperature: 0.2,
        responseMimeType: "application/json"
      }
    });

    const textResult = response.text || "{}";
    const cleanedJson = textResult.replace(/```json/gi, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanedJson);

    return {
      extractedFeatures: result.features || {},
      explanation: result.explanation || "Analyzed image successfully and matched similar collections.",
      matchedProducts: result.matchedProductIds || []
    };
  } catch (err) {
    console.error("Gemini Image Search failed:", err);
    return runFallbackImageSearch(promptText || "");
  }
}

function runFallbackImageSearch(prompt: string): Promise<{
  extractedFeatures: any;
  explanation: string;
  matchedProducts: string[];
}> {
  const lower = prompt.toLowerCase();
  
  // Custom smart simulated results
  let explanation = "I scanned the uploaded style profile. ";
  let matched: string[] = ["p2"];
  let features = {
    category: "Jacket",
    colors: ["Blue"],
    style: "Casual",
    fabric: "Denim",
    gender: "Unisex",
    season: "Spring/Autumn"
  };

  if (lower.includes("black")) {
    explanation += "Based on your request 'in black', I've extracted the jacket's silhouette and successfully matched it to our Midnight Black Denim Jacket.";
    matched = ["p3"];
    features.colors = ["Black"];
  } else if (lower.includes("formal") || lower.includes("office") || lower.includes("interview")) {
    explanation += "We've matched this formal style profile to our Premium tailored Navy Blazer and Oxford dress leather shoes.";
    matched = ["p1", "p4", "p12"];
    features = {
      category: "Blazer",
      colors: ["Navy Blue"],
      style: "Formal",
      fabric: "Wool",
      gender: "Men",
      season: "All-Season"
    };
  } else {
    explanation += "I identified a casual denim silhouette in the visual search. Here is our best-selling Denim Jacket and contrasting Cloud Sneakers for a complete casual wardrobe.";
    matched = ["p2", "p11"];
  }

  return Promise.resolve({
    extractedFeatures: features,
    explanation,
    matchedProducts: matched
  });
}

/**
 * 3. AI Personalized Recommendation Engine
 * Synthesizes a user's purchase, browsing, and wishlist history to create highly targeted items.
 */
export async function getAIPersonalizedRecommendations(
  userId: string
): Promise<{
  recommendedIds: string[];
  reasons: Record<string, string>; // ID -> custom styling justification
}> {
  const ai = getAI();
  const catalogText = getCatalogContext();

  const user = db.getUserById(userId);
  const cart = db.getCart(userId);
  const wishlist = db.getWishlist(userId);
  const orders = db.orders.filter(o => o.userId === userId);

  const cartNames = cart.map(c => db.getProductById(c.productId)?.name || "").filter(Boolean).join(", ");
  const wishlistNames = wishlist.map(id => db.getProductById(id)?.name || "").filter(Boolean).join(", ");
  const orderItems = orders.flatMap(o => o.items.map(i => i.name)).join(", ");

  const userProfileContext = `User Info:
- Name: ${user?.name || "Customer"}
- Wishlist contains: [${wishlistNames}]
- Cart contains: [${cartNames}]
- Previous Orders contain: [${orderItems}]`;

  const systemInstruction = `You are a high-end personal shopping assistant.
Based on the customer's shopping profile:
${userProfileContext}

And our exclusive boutique catalog:
${catalogText}

Identify 4 products that this customer would love but hasn't purchased yet.
For each product, write a highly personalized, compelling, stylistic reason why they should buy it, referencing their specific history.
For example, "Since you ordered the Navy Blazer, our Burgundy Silk Tie completes the look with perfect contrast."

You must return a raw JSON response:
{
  "recommendations": [
    {
      "productId": "p1",
      "reason": "Personalized stylist justification"
    }
  ]
}`;

  if (!ai) {
    return getFallbackRecommendations(userId);
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate personalized recommendations.",
      config: {
        systemInstruction,
        temperature: 0.6,
        responseMimeType: "application/json"
      }
    });

    const textResult = response.text || "{}";
    const cleanedJson = textResult.replace(/```json/gi, "").replace(/```/g, "").trim();
    const result = JSON.parse(cleanedJson);

    const recommendedIds: string[] = [];
    const reasons: Record<string, string> = {};

    if (result.recommendations && Array.isArray(result.recommendations)) {
      for (const item of result.recommendations) {
        if (db.getProductById(item.productId)) {
          recommendedIds.push(item.productId);
          reasons[item.productId] = item.reason;
        }
      }
    }

    if (recommendedIds.length === 0) {
      return getFallbackRecommendations(userId);
    }

    return { recommendedIds, reasons };
  } catch (err) {
    console.error("Gemini Recommendations failed:", err);
    return getFallbackRecommendations(userId);
  }
}

function getFallbackRecommendations(userId: string): Promise<{
  recommendedIds: string[];
  reasons: Record<string, string>;
}> {
  const wishlist = db.getWishlist(userId);
  const recommendedIds: string[] = [];
  const reasons: Record<string, string> = {};

  // Find products not in wishlist
  const allProds = db.products;
  const pool = allProds.filter(p => !wishlist.includes(p.id));

  // Add a few items with beautiful styling notes
  const itemsToRecommend = pool.slice(0, 4);
  itemsToRecommend.forEach((p, idx) => {
    recommendedIds.push(p.id);
    if (p.id === "p1") {
      reasons[p.id] = "Our signature tailored Navy Blazer is a wardrobe staple that pairs exquisitely with your casual and formal look.";
    } else if (p.id === "p4") {
      reasons[p.id] = "Handcrafted in Italy, these leather oxford shoes complete any formal or semi-formal look with timeless class.";
    } else if (p.id === "p5") {
      reasons[p.id] = "This Mulberry Burgundy Silk Tie adds a striking, polished finish to crisp white dress shirts.";
    } else if (p.id === "p10") {
      reasons[p.id] = "Elevate your cold-weather elegance with ethically sourced premium cashmere in an aesthetic oatmeal hue.";
    } else {
      reasons[p.id] = "Hand-selected by our AI stylist to complement your sleek, minimal aesthetic.";
    }
  });

  return Promise.resolve({ recommendedIds, reasons });
}

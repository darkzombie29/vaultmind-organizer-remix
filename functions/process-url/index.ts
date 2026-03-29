import { createClient } from "npm:@blinkdotnew/sdk";

// CORS headers - required for all browser requests
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

// Detect platform from URL
function detectPlatform(url: string): string {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes("instagram.com")) return "Instagram";
    if (hostname.includes("linkedin.com")) return "LinkedIn";
    if (hostname.includes("twitter.com") || hostname.includes("x.com")) return "X";
    if (hostname.includes("reddit.com")) return "Reddit";
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) return "YouTube";
    if (hostname.includes("tiktok.com")) return "TikTok";

    return "Web";
  } catch {
    return "Web";
  }
}

// Infer default content_type from platform (used as fallback hint in prompt)
function getPlatformContentTypeHint(platform: string): string {
  switch (platform) {
    case "YouTube":
      return "Video";
    case "Instagram":
    case "TikTok":
      return "Reel";
    case "LinkedIn":
    case "Reddit":
      return "Article";
    default:
      return "Article";
  }
}

async function handler(req: Request): Promise<Response> {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const projectId = Deno.env.get("BLINK_PROJECT_ID");
    const secretKey = Deno.env.get("BLINK_SECRET_KEY");

    if (!projectId || !secretKey) {
      return new Response(
        JSON.stringify({ error: "Missing server configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    let body: { url?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { url } = body;

    if (!url || typeof url !== "string" || url.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Missing required field: url" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Detect platform from URL
    const platform = detectPlatform(url.trim());
    const contentTypeHint = getPlatformContentTypeHint(platform);

    // Initialize Blink SDK in headless mode (server-side)
    const blink = createClient({
      projectId,
      secretKey,
      auth: { mode: "headless" },
    });

    // Generate structured metadata using AI
    const { object } = await blink.ai.generateObject({
      model: "gpt-4.1-mini",
      system:
        "You are a content categorization AI. Given a URL, determine what the content is likely about and generate metadata for an ADHD-friendly content organizer.",
      prompt: `Analyze this URL and generate metadata: ${url.trim()}

Platform detected: ${platform}
Default content type hint: ${contentTypeHint}

Rules:
- title: concise, max 80 characters
- summary: exactly 2 sentences max, max 200 characters total, describing what the content is likely about
- tags: choose 1-3 tags ONLY from this list: ["Business", "Fitness", "Career", "Tech", "Entertainment", "Ideas", "Health", "Finance", "Design", "Food", "Travel", "Science"]
- content_type: choose ONE from ["Article", "Video", "Reel", "Idea", "Product", "Other"]
  * Use "Video" if platform is YouTube
  * Use "Reel" if platform is Instagram or TikTok
  * Use "Article" for Web, LinkedIn, Reddit
  * Use "Other" if unclear
  * Use "Product" if the URL looks like a product page
  * Use "Idea" if the URL looks like a personal note or idea`,
      schema: {
        type: "object",
        properties: {
          title: { type: "string" },
          summary: { type: "string" },
          tags: { type: "array", items: { type: "string" } },
          content_type: { type: "string" },
        },
        required: ["title", "summary", "tags", "content_type"],
      },
    });

    // Build and return response
    const result = {
      platform,
      title: (object.title as string).slice(0, 80),
      summary: (object.summary as string).slice(0, 200),
      tags: (object.tags as string[]).slice(0, 3),
      content_type: object.content_type as string,
      thumbnail: "",
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing URL:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process URL", details: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

Deno.serve(handler);

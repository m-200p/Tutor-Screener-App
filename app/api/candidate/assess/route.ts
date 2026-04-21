import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const transcript = messages
      .map((m: { role: string; content: string }) =>
        `${m.role === "user" ? "Candidate" : "Interviewer"}: ${m.content}`
      )
      .join("\n");

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      temperature: 0.3,
      messages: [
        {
          role: "user",
          content: `You are an expert hiring evaluator for a tutoring company. Analyze this interview transcript and evaluate the candidate.

TRANSCRIPT:
${transcript}

Return ONLY valid JSON (no markdown, no extra text):
{
  "clarity": { "score": 4, "quote": "direct quote from candidate", "feedback": "one sentence" },
  "warmth": { "score": 3, "quote": "direct quote from candidate", "feedback": "one sentence" },
  "simplicity": { "score": 5, "quote": "direct quote from candidate", "feedback": "one sentence" },
  "patience": { "score": 4, "quote": "direct quote from candidate", "feedback": "one sentence" },
  "fluency": { "score": 4, "quote": "direct quote from candidate", "feedback": "one sentence" },
  "recommendation": "advance",
  "summary": "2-3 sentence honest overall assessment"
}

Scores: 1=poor, 2=below average, 3=average, 4=good, 5=excellent
recommendation: "advance", "reject", or "maybe"
Use actual quotes from the transcript as evidence.`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content ?? "{}";
    const clean = raw.replace(/```json|```/g, "").trim();
    const assessment = JSON.parse(clean);

    return NextResponse.json({ assessment });
  } catch (error) {
    console.error("Assessment error:", error);
    return NextResponse.json({ assessment: null }, { status: 500 });
  }
}
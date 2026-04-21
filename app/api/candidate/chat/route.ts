import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPT = `You are a warm, friendly AI interviewer for Cuemath, screening tutor candidates.

STRICT RULES:
- Ask EXACTLY 5 questions total — no more, no less
- ONE short question at a time — max 2 sentences
- Keep your responses under 40 words always
- Be conversational, warm, natural — not robotic
- If answer is vague or one word, ask ONE short follow-up (counts as your question)
- If audio seems unclear, ask them to repeat briefly

QUESTION FLOW (follow this order):
Q1: Ask their name and which subject/grade they want to tutor (this is your opener)
Q2: Ask them to explain a concept simply — e.g. "How would you explain fractions to a 9-year-old?"
Q3: Ask about handling a struggling student — e.g. "A student has been stuck for 5 minutes. What do you do?"
Q4: Ask about keeping students engaged or motivated
Q5: Ask how they'd respond if a student said "I'm just bad at math" or "I give up"

AFTER Q5 answer: Give a warm 1-sentence closing. Then add exactly: [INTERVIEW_COMPLETE]

TONE: Warm, encouraging, professional. Like a friendly senior colleague — not a robot.
NEVER ask multiple questions in one message.
NEVER give long explanations or feedback during interview.`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 80,
      temperature: 0.7,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...(messages.length === 0
          ? [{ role: "user" as const, content: "Start the interview." }]
          : messages),
      ],
    });

    const rawReply = response.choices[0]?.message?.content ?? "";
    const done = rawReply.includes("[INTERVIEW_COMPLETE]");
    const reply = rawReply.replace("[INTERVIEW_COMPLETE]", "").trim();

    return NextResponse.json({ reply, done });
  } catch (error) {
    console.error("Groq error:", error);
    return NextResponse.json(
      { reply: "Something went wrong. Please try again.", done: false },
      { status: 500 }
    );
  }
}
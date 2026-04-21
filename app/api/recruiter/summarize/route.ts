import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { candidate } = await req.json();
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: `You are an expert hiring assistant. Write a 2-sentence actionable hiring recommendation.

Candidate: ${candidate.name}
Subject: ${candidate.subject}
Score: ${candidate.score}/100
Summary: ${candidate.summary}

Be direct. Mention one strength and one consideration.`,
        },
      ],
    });
    const summary = response.choices[0]?.message?.content ?? "";
    return NextResponse.json({ summary });
  } catch (error) {
    console.error("Groq error:", error);
    return NextResponse.json({ summary: "Error generating summary." }, { status: 500 });
  }
}
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

import dalatData from '@/lib/data.json';
import { handleRouteError, jsonError } from '@/lib/http';

export const dynamic = 'force-dynamic';

type ChatBody = {
  message?: string;
  language?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ChatBody;
    const message = body.message?.trim();
    const language = body.language ?? 'vi';

    if (!message) {
      return jsonError(400, 'Message is required');
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return jsonError(500, 'No API Key found');
    }

    const modelName = process.env.GEMINI_MODEL || 'gemini-flash-latest';
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    const langInstructions =
      language === 'vi'
        ? 'Tra loi ngan gon bang tieng Viet, dung Markdown de dinh dang de doc, xuong dong giua cac y, va in dam cac dia diem quan trong:'
        : 'Answer briefly in English using Markdown formatting, break ideas into separate lines, and bold key place names:';

    const roleDescription =
      language === 'vi'
        ? 'Ban la huong dan vien du lich Da Lat than thien va nhiet tinh.'
        : 'You are a friendly and enthusiastic Dalat travel guide.';

    const prompt = `
${roleDescription} Hay tra loi cau hoi dua tren du lieu sau:
${JSON.stringify(dalatData)}

Cau hoi: ${message}
${langInstructions}
`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return NextResponse.json({ response: text, success: true });
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.includes('404') || error.message.includes('not found'))
    ) {
      return NextResponse.json(
        {
          error: 'Model Not Found',
          message:
            'Ten model trong code khong khop voi API key. Hay kiem tra GEMINI_MODEL.',
          details: error.message,
        },
        { status: 404 },
      );
    }

    return handleRouteError(error, 'AI Error');
  }
}

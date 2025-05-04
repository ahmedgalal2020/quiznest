// src/app/api/translate/route.js
import { NextResponse } from 'next/server';
import { Translator } from '@vitalets/google-translate-api';

export async function POST(req) {
  try {
    const { text, sourceLang, targetLang } = await req.json();

    if (!text || !sourceLang || !targetLang) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await Translator(text, {
      from: sourceLang,
      to: targetLang
    });

    return NextResponse.json({ translation: result.text });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { error: 'Translation failed' },
      { status: 500 }
    );
  }
}
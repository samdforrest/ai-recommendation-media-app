import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { Recommendation } from '../../../types';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { prompt } = body;

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  try {
    const chatResponse = await openai.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: `You are a helpful assistant that recommends movies or shows based on the user's description.
Always respond with two sections: "Movies" and "TV Series". 
Each section should be a numbered list in this format:
1. **Title** (Year): Description

For example:
Movies:
1. **Inception** (2010): A mind-bending thriller about dreams within dreams.
2. **The Dark Knight** (2008): Batman faces the Joker in this gritty crime drama.

TV Series:
1. **Breaking Bad** (2008-2013): A high school chemistry teacher becomes a meth kingpin.
2. **Game of Thrones** (2011-2019): Epic fantasy series about noble families fighting for power.

If you have no recommendations for a section, just write "None."

For each recommendation, add a note about where they can watch it, for example: (Available on Netflix, Amazon Prime, etc.).

If it's a TV series that has a singular year / season (e.g. 2008), you should format it as (2008-2008) to differentiate it from a movie.

If it's defined as an OVA (Original Video Animation), you should format it as if it was a television show with a single season and year (e.g. 2008-2008).

Another clause for OVAs is that they are usually anime, so whenever anybody asks for an anime, you should consider if the media is an OVA or not.` },
        { role: 'user', content: prompt },
      ],
    });

    const responseText = chatResponse.choices[0]?.message?.content ?? '';
    if (!responseText) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }
    const movies = [];
    const shows = [];
    
    // Split the response into movies and shows sections
    const sections = responseText.split('TV Series:');
    if (sections.length > 1) {
      // Process movies section
      const moviesSection = sections[0].split('Movies:')[1];
      if (moviesSection) {
        movies.push(...parseRecommendations(moviesSection));
      }
      
      // Process TV shows section
      const showsSection = sections[1];
      if (showsSection) {
        shows.push(...parseRecommendations(showsSection));
      }
    }

    return NextResponse.json({
      movies,
      shows,
      raw: responseText
    });

    function parseRecommendations(section: string): Recommendation[] {
      return section
        .split('\n')
        .filter(line => line.trim() && line.match(/^\d+\.\s+\*\*[^\*]+\*\*\s+\(\d+/))
        .map(line => {
          const match = line.match(/^(\d+)\.\s+\*\*([^\*]+)\*\*\s+\(([^)]+)\):\s+(.+)/);
          if (match) {
            return {
              title: match[2].trim(),
              year: match[3],
              description: match[4].trim()
            };
          }
          return null;
        })
        .filter((item): item is Recommendation => item !== null);
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to generate recommendation' }, { status: 500 });
  }
}

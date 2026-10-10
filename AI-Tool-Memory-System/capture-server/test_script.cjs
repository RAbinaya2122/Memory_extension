require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const ai = new GoogleGenAI({apiKey: process.env.GEMINI_API_KEY});

const prompt = `
Analyze the following AI tool URL and extract its information.
URL: https://gamma.app

Provide the analysis in the following strict JSON format ONLY.
No other text.

{
  "name": "Name of the tool",
  "category": "One of: Productivity, Writing, Design, Development, Marketing, Video, Audio, Other",
  "description": "A concise 1-2 sentence description of what the tool does",
  "useCase": "When should someone use this?"
}

Do not include any conversational text or markdown formatting outside the JSON object.
`;

async function test() {
  let attempt = 1;
  while(attempt <= 3) {
    try {
      console.log('attempt', attempt);
      const res = await ai.models.generateContent({model: 'gemini-3.7-flash', contents: prompt});
      console.log('success:', res.text);
      return;
    } catch(e) {
      console.log('failed', attempt, e.message);
      const w = Math.pow(2, attempt - 1) * 1000;
      console.log('waiting', w);
      await new Promise(r => setTimeout(r, w));
      attempt++;
    }
  }
}
test();

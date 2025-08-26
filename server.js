import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';
// --- REMOVED --- path and fileURLToPath are no longer needed.

dotenv.config();
const app = express();
const port = process.env.PORT || 8080;

// --- REMOVED --- The __filename and __dirname setup is no longer needed.

// --- IMPORTANT CORS UPDATE ---
// This is more secure. It only allows your Vercel app to make requests.
// You will get your Vercel URL after you deploy the frontend there.
app.use(cors({
  origin: "https://linkdln-post1.vercel.app"
}));

app.use(express.json());

if (!process.env.GEMINI_API_KEY) {
  console.error("Error: GEMINI_API_KEY is not defined in your .env file.");
  process.exit(1);
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


// --- YOUR API LOGIC (UNCHANGED) ---
app.post('/generate', async (req, res) => {
  const { topic, details, emotion, urgency } = req.body;

  if (!topic) {
    return res.status(400).json({ message: 'Topic is required.' });
  }

  try {
    if (details) {
      const personaPrompt = `
        Act as a world-class persuasion expert and narrative strategist...
        User's Core Topic: "${topic}"
        User's Detailed Answers: ${JSON.stringify(details, null, 2)}
        Emotionality Level: ${emotion}/100.
        Urgency/FOMO Level: ${urgency}/100.
        ...Generate the post...
          IMPORTANT INSTRUCTIONS:
  1. Your response must ONLY be the text for the LinkedIn post itself.
  2. Do NOT include any commentary, analysis, or explanations like "Why this works."
  3. Do NOT add any introductory text like "Here is the post you requested:".
  4. Start the response directly with the post's headline and end it with the hashtags.
      `;
      const result = await model.generateContent(personaPrompt);
      const response = await result.response;
      return res.status(200).json({ post: response.text() });
    }

    const analysisPrompt = `
      A user wants to write a LinkedIn post, story, or presentation script about the following topic: "${topic}".
      Analyze the user's topic to understand its context (e.g., is it a personal achievement, a technical explanation, a project launch?).
      Based on your analysis, generate 3 to 5 essential and specific follow-up questions that will help the user provide the necessary details to build a compelling narrative.
      
      IMPORTANT: Your response MUST contain a valid JSON object with a single key "questions", which is an array of strings. Do not add any other text or markdown.
      Example: {"questions": ["What was your specific role?", "What was the biggest challenge?"]}
    `;
    const result = await model.generateContent(analysisPrompt);
    const response = await result.response;
    const textResponse = response.text();

    try {
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No valid JSON object found in the AI response.");
      }
      
      const jsonString = jsonMatch[0];
      const questionsObject = JSON.parse(jsonString);

      if (questionsObject && Array.isArray(questionsObject.questions)) {
        res.status(200).json({ followUpQuestions: questionsObject.questions });
      } else {
        throw new Error("JSON structure is valid, but the 'questions' array is missing.");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response, using fallback. Error:", parseError.message);
      console.error("Original AI Response:", textResponse);
      res.status(200).json({ 
          followUpQuestions: [
              "Could you please provide more specific details about this?", 
              "What was your main role or contribution?", 
              "What was the most important lesson you learned?"
          ] 
      });
    }

  } catch (error) {
    console.error('Error in /generate endpoint:', error);
    res.status(500).json({ message: 'Failed to generate post. Please check the server logs.' });
  }
});
// --- END OF YOUR API LOGIC ---


// --- REMOVED --- The section that served the React app is now gone.


app.listen(port, () => {
  // A more accurate log message for an API server
  console.log(`✨ API server is listening on port ${port}`);
});

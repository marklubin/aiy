// filepath: /Ubuntu/home/mark/aiy/firebase-chat/src/app/api.ts
import axios from 'axios';

const OPENAI_API_KEY = 'your-openai-api-key';

export const getAIResponse = async (message: string): Promise<string> => {
  const response = await axios.post(
    'https://api.openai.com/v1/completions',
    {
      model: 'text-davinci-003',
      prompt: message,
      max_tokens: 150
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      }
    }
  );

  return response.data.choices[0].text.trim();
};
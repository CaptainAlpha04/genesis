import { GoogleGenerativeAI} from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GENERATOR_MODEL_API);

export async function GeneratorModel(request) {
    const model = await genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
        systemInstruction: process.env.GENERATOR_SYSTEM_INSTRUCTS,
        generationConfig: {
            responseMimeType: 'application/json',
        }
    });

    const prompt = request || 'Generate a persona';
    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // Clean and parse the JSON response
    try {
        // Remove any leading or trailing whitespace
        responseText = responseText.trim();

        // Ensure the response is a valid JSON string
        if (responseText.startsWith('{') && responseText.endsWith('}')) {
            // Parse the JSON string
            let response = JSON.parse(responseText);

            // Log and return the response object
            console.log(response);
            return response;
        } else {
            throw new Error('Response is not a valid JSON object');
        }
    } catch (error) {
        console.error('Error parsing JSON response:', error);
        return null;
    }
}

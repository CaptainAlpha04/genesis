import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const safetySettings = [
    { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
];

class ActorModel {
    constructor(persona) {
        this.persona = persona;
        this.ActorSystemInstructs = `You are ${persona} + ${process.env.ACTOR_SYSTEM_INSTRUCTS}`; 
        this.chat = null;
    }

    async callActorModel(chatMessage) {
        const genAI = new GoogleGenerativeAI(Math.random() < 0.5 ? process.env.ACTOR_MODEL_API : process.env.GENERATOR_MODEL_API);
        await this.sleep(10000);  // Ensuring a delay

        if (!this.chat) {
            const model = await genAI.getGenerativeModel({
                model: 'gemini-1.5-pro',
                systemInstruction: this.ActorSystemInstructs,
                safetySettings
            });
            this.chat = model.startChat();
        }

        const prompt = chatMessage || `"Starts the conversation"`;

        try {
            const result = await this.retryWithBackoff(async () => {
                console.log(this.chat.getHistory());
                return await this.chat.sendMessage(prompt);
            });
            return result.response.text();
        } catch (error) {
            console.error('Failed to get response:', error);
            return '';
        }
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async retryWithBackoff(fn, retries = 5, delay = 1000) {
        let attempt = 0;
        while (attempt < retries) {
            try {
                return await fn();
            } catch (error) {
                if (error.response && error.response.status === 429) {
                    attempt++;
                    const backoffDelay = delay * Math.pow(2, attempt);
                    console.warn(`Retrying after ${backoffDelay}ms due to rate limiting...`);
                    await this.sleep(backoffDelay);
                } else {
                    throw error;
                }
            }
        }
        throw new Error('Max retries reached');
    }
}

export default ActorModel;

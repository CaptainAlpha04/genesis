import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import dotenv from 'dotenv';
import bot from '../model/botSchema.mjs';
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

    async getChat() {
        return this.chat;
    }

    async setChat(chat) {
        this.chat = chat;
    }

    async callActorModel(chatMessage, userID, botName) {
        const genAI = new GoogleGenerativeAI(Math.random() < 0.5 ? process.env.ACTOR_MODEL_API_ONE : process.env.ACTOR_MODEL_API_TWO);
        await this.sleep(10000);  // Ensuring a delay

        if (!this.chat) {
            const chatHistory = await this.loadChatHistory(userID, botName);
            const model = await genAI.getGenerativeModel({
                model: 'gemini-1.5-pro',
                systemInstruction: this.ActorSystemInstructs,
                safetySettings,
                generationConfig: {
                    responseMimeType: 'application/json',
                }
            });
            this.chat = model.startChat({
                history: chatHistory,
                generationConfig: {
                    responseMimeType: 'application/json',
                }
            })
        }

        const prompt = chatMessage || `"Starts the conversation"`;

        try {
            const result = await this.retryWithBackoff(async () => {
                return await this.chat.sendMessage(prompt);
            });
            
            return result.response.text();
        } catch (error) {
            console.error('Failed to get response:', error);
            return '';
        }
    }

    async loadChatHistory(userID, botName) {
        const botDocument = await bot.findOne({ 'personalInfo.Name': botName });
        if (botDocument && botDocument.ChatHistory) {
            const userChatHistory = botDocument.ChatHistory.find(chat => chat.userID === userID);
            if (userChatHistory && userChatHistory.chat) {
                return userChatHistory.chat.flatMap(entry => [
                    { role: 'user', parts: [{ text: entry.user }] },
                    { role: 'model', parts: [{ text: entry.bot }] }
                ]);
            }
        }
        return [];
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

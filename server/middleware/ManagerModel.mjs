import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import { bot, user } from '../model/botSchema.mjs';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.MANAGER_MODEL_API);

async function ManagerModel(botResponse, userMessage, userID) {
    const ActorSystemInstructs = process.env.MANAGER_SYSTEM_INSTRUCTS;

    const model = await genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
        systemInstruction: ActorSystemInstructs,
    });

    const combinedMessage = `Bot: ${botResponse}\nUser (${userID}): ${userMessage}`;

    try {
        const information = await model.generateContent(combinedMessage);
        console.log(information.response.text());
        return information.response.text();
    } catch (error) {
        console.log(error);
        return "NNIP";
    }
}

export default ManagerModel;

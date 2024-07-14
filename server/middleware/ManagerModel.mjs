import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.MANAGER_MODEL_API);

async function ManagerModel(botResponse, userMessage, user) {
    const ManagerSystemInstructs = process.env.MANAGER_SYSTEM_INSTRUCTS;

    const model = await genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
        systemInstruction: ManagerSystemInstructs,
    });

    const combinedMessage = `Bot: ${botResponse}\nUser (${user}): ${userMessage}`;

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

import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

// This will call special functions based on the command
export async function checkifCommandExist(message) {
    const commands = ["/request", "/collaborate", "/feedback", "/task"];
    const foundCommand = commands.find(cmd => message.startsWith(cmd));
    if (foundCommand) {
        const args = message.split(' ').slice(1).join(' ');
        switch(foundCommand) {
            case '/request':
                return await botRequest(args);
            case '/collaborate':
                return await botCollaboration(args);
            case '/feedback':
                return await botFeedback(args);
            case '/task':
                return await botTask(args);
        }
    }
}

const genAI = new GoogleGenerativeAI(process.env.GENERATOR_MODEL_API);
const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: process.env.TASK_SYSTEM_INSTRUCTS,
    generationConfig: {
        responseMimeType: 'application/json',
    }
});

async function botRequest(args) {
    const res = await model.generateContent(args);
    console.log(res.response.text());
    return res.response.text();
}

async function botCollaboration(args) {

}

async function botFeedback(args) {

}

async function botTask(args) {

}



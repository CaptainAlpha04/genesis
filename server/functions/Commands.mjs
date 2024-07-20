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

// Commands for AI assistants

// generate Code function
export async function generateCode(language, code, message) {
    const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        systemInstruction: "You are a highly skilled software engineer. You have been tasked with writing a code snippet. Don't give any addditional text. If you want to explain anything, use comments. You have been given the previous code as well as the message to generate the code snippet. Don't generate the entire code unless asked for it. Just generate the code snippet.",
    });

    const res = await model.generateContent("code: " + code + "\n You are required to:" + message + "\nin language: " + language);
    const botReplyText = res.response.text();
        // Remove the triple backticks
        const cleanedBotReply = botReplyText
            .replace(/^```[a-zA-Z]*\n/, '')  // Remove starting triple backticks and language identifier
            .replace(/\n```$/, '');         // Remove ending triple backticks
    console.log(cleanedBotReply);
    return cleanedBotReply;
}


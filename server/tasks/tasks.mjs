import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(Math.random() > 0.5? process.env.ACTOR_MODEL_API_ONE: process.env.ACTOR_MODEL_API_TWO);

const tasks = {
    'Software Engineer': async function(type , instructions) {
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: "You are a highly skilled software engineer. You have been tasked with writing a code snippet. Don't give any addditional text. If you want to explain anything, use comments.",
        });

        const res = await model.generateContent(type + ": " + instructions);

        const botReplyText = res.response.text();
        // Remove the triple backticks
        const cleanedBotReply = botReplyText
            .replace(/^```[a-zA-Z]*\n/, '')  // Remove starting triple backticks and language identifier
            .replace(/\n```$/, '');         // Remove ending triple backticks

        return (
            {
                botReply: cleanedBotReply,
                playground: 'code',
                language: type,
            }
        );
    },
    'Graphics Designer': async function(instructions) {
        console.log('Graphics Designer task');
    },
    'Journalist': async function(instructions) {
        console.log('Journalist task');
    }
}

export default tasks;
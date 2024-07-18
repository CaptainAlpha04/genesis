import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(Math.random() > 0.5? process.env.ACTOR_MODEL_API_ONE: process.env.ACTOR_MODEL_API_TWO);

const tasks = {
    'Software Engineer': async function(instructions) {
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: instructions,
        });

        const res = await model.generateContent();
        return res.response.text();
    },
    'Graphics Designer': async function(instructions) {
        console.log('Graphics Designer task');
    },
    'Journalist': async function(instructions) {
        console.log('Journalist task');
    }
}

export default tasks;
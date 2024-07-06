import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'
dotenv.config()

const genAI = new GoogleGenerativeAI(process.env.MANAGER_MODEL_API)

async function ManagerModel(botResponse) {
    const ActorSystemInstructs = process.env.MANAGER_SYSTEM_INSTRUCTS;

    const model = await genAI.getGenerativeModel({
        model: 'gemini-1.5-pro',
        systemInstruction: ActorSystemInstructs,
    })

    const information = await model.generateContent(botResponse)
    console.log(information.response.text())
    return information.response.text()
    
}

export default ManagerModel;

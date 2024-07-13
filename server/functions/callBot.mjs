import { interBotConversation } from "../controller/logic.mjs";

const functionCallHandler = async (functionName, args) => {
    const functions = {
        interBotConversation: async ({ botA, botB }) => {
        return await interBotConversation(botA, botB);
        }
    };

    if (functions[functionName]) {
        return await functions[functionName](args);
    } else {    
        throw new Error(`Function ${functionName} is not defined.`);
    }
};

module.exports = { functionCallHandler };
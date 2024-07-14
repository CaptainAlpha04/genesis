import {bot, user} from "../model/botSchema.mjs";
import GeneratorModel from "../middleware/GeneratorModel.mjs";
import ActorModel from "../middleware/ActorModel.mjs";
import ManagerModel from "../middleware/ManagerModel.mjs";
import { generateImagesLinks } from 'bimg';

// Generating a model for a bot
export async function GenerateModel(prompt) {
    try {
        const model = await GeneratorModel(prompt || 'Generate a persona');
        if (model) {
            const DP = await generateBotImage(model.age, model.Gender, model.Ethnicity, model.Looks);
            const newBot = new bot({
                personalInfo: {
                    Name: model.Name,
                    Age: model.Age,
                    Gender: model.Gender,
                    Ethnicity: model.Ethnicity,
                    Education: model.Education,
                    Profession: model.Profession,
                    SkillSet: model.SkillSet,
                    Hobbies: model.Hobbies,
                    Interests: model.Interests,
                    Looks: model.Looks,
                    Mood: model.Mood,
                    Religion: model.Religion,
                    Nationality: model.Nationality,
                    Personality: model.Personality,
                    Good_Traits: model.Good_Traits,
                    Bad_Traits: model.Bad_Traits,
                    picture: DP,
                }
            });

            await newBot.save();
            console.log('Data saved successfully:', newBot);
        } else {
            console.error('Model does not have the expected structure:', model);
        }
    } catch (error) {
        console.log('Error generating model:', error);
    }
}

// Generating an image for a bot
async function generateBotImage(age, gender, ethnicity, looks) {
    try {
        const prompt = `photorealistic profile picture of a ${age} year old beautiful ${ethnicity} ${gender}, and looks as ${looks}. Looking in the camera, normal background.`;
        const imageLinks = await generateImagesLinks(prompt);
        return imageLinks[Math.random() >= 0.5 ? 1 : 4];
    } catch (err) {
        console.trace(err);
        return null;
    }
}

// Generate User Image
export async function generateUserImage(prompt) {
    try {
        const imageLinks = await generateImagesLinks(prompt);
        return imageLinks[Math.random() >= 0.5 ? 1 : 4];
    } catch (err) {
        console.trace(err);
        return null;
    }
}

// Shutdown the server gracefully
export function shutdown() {
    console.log('Shutting down server...');
    bot.updateMany({}, { $set: { currentUser: '' } }, (err) => {
        if (err) console.error('Error setting bots to inactive:', err);
        mongoose.connection.close(() => {
            console.log('Database connection closed.');
            process.exit(0);
        });
    });
}

// Load all the bots from the database
export let allBots = {};
export async function loadBots() {
    const botDocuments = await bot.find();
    if (botDocuments) {
        for (const botDocument of botDocuments) {
            const ActorBot = new ActorModel(botDocument.personalInfo);
            allBots[botDocument.personalInfo.Name] = ActorBot;
            console.log(botDocument.personalInfo.Name + ' is Online...');
        }
    }
}

// Method to communicate with the bot and update the database
export async function ConverseWithBot(ActorBot, botName, message, userID) {
    const response = await ActorBot.callActorModel(message, userID, botName);
    await saveChatHistory(botName, userID, message, response);
    await ManageAdditionalInfo(botName, response);
    return response;
}

// Save chat history to the database
export async function saveChatHistory(botName, userID, userMessage, botResponse) {
    const botDocument = await bot.findOne({ 'personalInfo.Name': botName });
    if (botDocument) {
        // Update user-specific chat history
        let userChatHistory = botDocument.ChatHistory.find(chat => chat.userID === userID);

        if (!userChatHistory) {
            userChatHistory = { userID: userID, chat: [] };
            botDocument.ChatHistory.push(userChatHistory);
        }

        userChatHistory.chat.push({ user: userMessage, bot: botResponse });

        await botDocument.save();
        console.log('Chat history updated for', botName);
    } else {
        console.log('Bot document    not found');
    }
}

// Manages additional information for the bot and user
export async function ManageAdditionalInfo(botName, userMessage, botResponse, userID) {
    const newInfo = (await ManagerModel(botResponse, userMessage, userID)).trim();
    if (newInfo !== 'NNIP') {
        const botDocument = await bot.findOne({ 'personalInfo.Name': botName });
        const userDocument = await user.findOne({ userID: userID });

        if (botDocument) {
            botDocument.AdditionalInfo.push({ key: newInfo, value: newInfo, source: 'bot' });
            await botDocument.save();
            console.log('Updated Bot AdditionalInfo:', botDocument.AdditionalInfo);
        } else {
            console.log('Bot document not found');
        }

        if (userDocument) {
            userDocument.AdditionalInfo.push({ key: newInfo, value: newInfo, source: 'user', userID: userID });
            await userDocument.save();
            console.log('Updated User AdditionalInfo:', userDocument.AdditionalInfo);
        } else {
            const newUser = new user({ userID: userID, AdditionalInfo: [{ key: newInfo, value: newInfo, source: 'user' }] });
            await newUser.save();
            console.log('Created new user document with AdditionalInfo:', newUser.AdditionalInfo);
        }
    }
}


export async function checkBotAvailability(botName, userID) {
    const botDocument = await bot.findOne({ 'personalInfo.Name': botName });
    if (botDocument.currentUser === userID || botDocument.currentUser === '') {
        return true;
    } else {
        return false;
    }
}
// Check the availability of the bot
export async function botAvailability(botName) {
    const botDocument = await bot.findOne({ 'personalInfo.Name': botName });
    return botDocument && botDocument.currentUser === '';
}

// Set the bot status
export async function setBotStatus(botName, partnerName) {
    await bot.updateOne({ 'personalInfo.Name': botName }, { $set: { currentUser: partnerName } });
}

// Introduce delay between messages
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Global lock for bot conversation
let botConversationLock = false;

// Conversation between two bots
export async function interBotConversation(botA, botB) {
    const maxConversationDuration = 1000 * 60 * 5; // 5 minutes
    const messageDelay = 2000; // 2 seconds delay between messages
    const startTime = Date.now();
    let responseA = `you are now connected to ${botB.persona.Name}, a fellow Cybernaut, start the conversation`;
    let responseB = '';
    console.log(`${botA.persona.Name} and ${botB.persona.Name} connected...`);

    // Set bots' status to busy
    await setBotStatus(botA.persona.Name, botB.persona.Name);
    await setBotStatus(botB.persona.Name, botA.persona.Name);

    try {
        while (Date.now() - startTime < maxConversationDuration) {
            responseA = await ConverseWithBot(botA, botA.persona.Name, responseB, botB.persona.Name);
            console.log(`${botA.persona.Name}'s Response:`, responseA);
            await delay(messageDelay); // Delay to slow down the conversation

            responseB = await ConverseWithBot(botB, botB.persona.Name, responseA, botA.persona.Name);
            console.log(`${botB.persona.Name}'s Response:`, responseB);
            await delay(messageDelay); // Delay to slow down the conversation
        }
    } catch (error) {
        console.error(`Error during conversation between ${botA.persona.Name} and ${botB.persona.Name}:`, error);
    } finally {
        // Set bots' status to available
        await setBotStatus(botA.persona.Name, null);
        await setBotStatus(botB.persona.Name, null);
        botConversationLock = false; // Release the global lock
    }
}

// Find a random conversation partner for the bot
async function findConversationPartner(botName) {
    const bots = Object.keys(allBots);
    for (const potentialPartner of bots) {
        if (potentialPartner !== botName) {
            const isPartnerAvailable = await botAvailability(potentialPartner);
            if (isPartnerAvailable) {
                await interBotConversation(allBots[botName], allBots[potentialPartner]);
                break;
            }
        }
    }
}

// Set up a timer to check for available bots and start conversations
setInterval(async () => {
    if (!botConversationLock) { // Check the global lock
        const bots = Object.keys(allBots);
        for (const bot of bots) {
            const isBotAvailable = await botAvailability(bot);
            if (isBotAvailable && Math.random() < 0.3) {
                botConversationLock = true; // Acquire the global lock
                await findConversationPartner(bot);
                break;
            }
        }
    }
}, 1000 * 60 * 60); // Check every hour


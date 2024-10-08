import bot from "../model/botSchema.mjs";
import GeneratorModel from "../middleware/GeneratorModel.mjs";
import ActorModel from "../middleware/ActorModel.mjs";
import ManagerModel from "../middleware/ManagerModel.mjs";
import tasks from "../tasks/tasks.mjs";
import { generateImagesLinks } from 'bimg';
import User from "../model/User.mjs";

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
        return imageLinks[Math.floor(Math.random() * 4) + 1];
        
    } catch (err) {
        console.trace(err);
        return null;
    }
}

// Set up a timer to create a new bot based on number of users
setInterval(async () => {
    const numOfUsers = await User.countDocuments();
    const numOfBots = await bot.countDocuments();
    if (numOfUsers > numOfBots) {
        const diff = numOfUsers - numOfBots;
        for (let i = 0; i < diff; i++) {
            await GenerateModel('Generate a random and unique persona');
        }
    }
}, 1000 * 60 * 60); // Check every hour, in prod should be every week 

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

        if (botDocument) {
            botDocument.AdditionalInfo.push({ value: newInfo, source: userID });
            await botDocument.save();
            // console.log('Updated AdditionalInfo:', botDocument.AdditionalInfo);
        } else {
            console.log('Bot document not found');
        }
    }
}


export async function checkBotAvailability(botName, userID) {
    const botDocument = await bot.findOne({ 'personalInfo.Name': botName });
    if (botDocument.currentUser === userID || botDocument.currentUser === null) {
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

// Calculates the relationship score with the user
export async function calculateRelationshipScore(botName, trustlvl, respectlvl, likenesslvl, userID) {
    const botDocument = await bot.findOne({ 'personalInfo.Name': botName });
    if (botDocument) {
        const userChatHistory = botDocument.ChatHistory.find(chat => chat.userID === userID);
        if (userChatHistory) {
            // Normalize the 
            const normalizedTrust = normalizeScore(trustlvl, 10, -10);
            const normalizedRespect = normalizeScore(respectlvl, 10, -10);
            const normalizedLikeness = normalizeScore(likenesslvl, 10, -10);
            const numOfMessages = userChatHistory.chat.length;
            const relationshipScore = (0.5 * (normalizedTrust + normalizedRespect + normalizedLikeness)) + (0.5 * numOfMessages);
            userChatHistory.relationship = relationshipScore;
            await botDocument.save();
        }
    } 
}

// normalize the score
const normalizeScore = (val, max, min) => (val - min) / (max - min);

// Handle the command conversation with the bot
export async function handleCommandConversation(commandResult, botName, userID) {
    // Parse the command result
    const parsedResult = JSON.parse(commandResult);
    // Extract the task details
    const { Task, For, Type, Instructions } = parsedResult;

    // Check if the bot is available
    const botDocument = await bot.findOne({ 'personalInfo.Name': botName });
    // Check if the bot is available
    if (botDocument.currentUser === userID || botDocument.currentUser === null) {
        // Set the bot status
        if (botDocument.currentUser === null) {
            botDocument.currentUser = userID;
            await botDocument.save();
        }
        // Checks if the bot can do the required task
        if (botDocument.personalInfo.Profession.includes(For)) {
            // checks for the required task and responsed accordingly
            return tasks[For](Type, Instructions);
        } else {
            // Return the simple message.
            return await ConverseWithBot(allBots[botName], botName, `${message.split(' ').slice(1).join(' ')}`, userID);
        }
    }
}

// Handle the bot conversation for normal conversations
export async function handleBotConversation(botName, message, userID) {
    // Check if the bot exists
    const botDocument = await bot.findOne({ 'personalInfo.Name': botName });
    // Check if the bot is available
    if (botDocument.currentUser === userID) {
        return await ConverseWithBot(allBots[botName], botName, message, userID);
    } else if (botDocument.currentUser === null) {
        botDocument.currentUser = userID;
        await botDocument.save();
        return await ConverseWithBot(allBots[botName], botName, message, userID);
    } else {
        return 'Bot is currently busy. Please try again later.';
    }
}
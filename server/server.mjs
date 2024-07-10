import express from 'express';
import GeneratorModel from './middleware/GeneratorModel.mjs';
import ActorModel from './middleware/ActorModel.mjs';
import ManagerModel from './middleware/ManagerModel.mjs';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bot from './model/botSchema.mjs';
import { generateImagesLinks } from 'bimg';
dotenv.config();

// Middlewares
const app = express();
const PORT = process.env.PORT || 8000;
app.use(express.json());
app.use(cors());

// Connecting to MongoDB database
mongoose.connect(process.env.MONGODB_URI)
    .then(() => { console.log('Connected to MongoDB'); })
    .catch((err) => console.log(err));

// Generating a model for a bot
async function GenerateModel(prompt) {
    try {
        const model = await GeneratorModel(prompt || 'Generate a persona');
        if (model) {
            const DP = await generateImage(model.age, model.Gender, model.Ethnicity, model.Looks);
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

// await GenerateModel('Generate an Indian woman');
// await GenerateModel('Generate a caucasian male');
// await GenerateModel('Generate a palestinian woman');
// await GenerateModel('Generate a Asian American male');

// Generating a image for a bot
async function generateImage(age, gender, ethnicity, looks) {
    try {
        const prompt = `photorealistic profile picture of a ${age} year old beautiful ${ethnicity} ${gender}, and looks as ${looks}. Looking in the camera, normal background.`;
        const imageLinks = await generateImagesLinks(prompt);
        console.log(imageLinks);
        return imageLinks[Math.random() >= 0.5 ? 1 : 4];
        } catch (err) {
        console.trace(err);
        return null;
    }
}

// Simulation of a conversation between two bots
async function simulation() {
    const personA = await GeneratorModel('Generate a persona');
    const personB = await GeneratorModel('Generate a persona');
    console.log(personA, personB);

    // Initializing two actor models objects
    const ActorA = new ActorModel(personA);
    const ActorB = new ActorModel(personB);

    let responseA = '';
    let responseB = '';

    console.log('Conversation between personA and personB');
    while (true) {
        responseA = await ActorA.callActorModel(responseB);
        console.log('PersonA:', responseA);
        responseB = await ActorB.callActorModel(responseA);
        console.log('PersonB:', responseB);
    }
}

// shutdowns the server gracefully
function shutdown() {
    console.log('Shutting down server...');
    // Set all bots to inactive
    bot.updateMany({}, { $set: { currentUser: null } }, (err) => {
        if (err) console.error('Error setting bots to inactive:', err);
        mongoose.connection.close(() => {
            console.log('Database connection closed.');
            process.exit(0);
        });
    });
}

// Load all the bots from the database
let allBots = {};
// Activates the bots
async function loadBots() {
    const botDocuments = await bot.find();
    if (botDocuments) {
        for (const botDocument of botDocuments) {
            const ActorBot = new ActorModel(botDocument.personalInfo);
            allBots[botDocument.personalInfo.Name] = ActorBot;
            allBots[botDocument.personalInfo.Name] = ActorBot;
            console.log(botDocument.personalInfo.Name + ' is Online...');
        }
    }
}

// Method to communicate with the bot and update the database
async function ConverseWithBot(ActorBot, botName, message, userID) {

    const response = await ActorBot.callActorModel(message, userID, botName);
    await saveChatHistory(botName, userID, message, response);
    await ManageAdditionalInfo(botName, response);
    return response;
}

// Save chat history to the database
async function saveChatHistory(botName, userID, userMessage, botResponse) {
    const botDocument = await bot.findOne({ 'personalInfo.Name': botName });
    if (botDocument) {
        // Find the chat history for the given userID
        let userChatHistory = botDocument.ChatHistory.find(chat => chat.userID === userID);

        if (!userChatHistory) {
            // If no chat history exists for this userID, create a new one
            userChatHistory = { userID: userID, chat: [] };
            botDocument.ChatHistory.push(userChatHistory);
        }

        // Append the user and bot messages as a nested structure
        userChatHistory.chat.push({ user: userMessage, bot: botResponse });

        await botDocument.save();
        console.log('Chat history updated for', botName);
    } else {
        console.log('Bot document not found');
    }
}

// Manages the additional information of the bot
async function ManageAdditionalInfo(botName, response) {
    const newInfo = (await ManagerModel(response || '')).trim();
    if (newInfo !== 'NNIP') {
        const botDocument = await bot.findOne({ 'personalInfo.Name': botName });
        if (botDocument) {
            botDocument.AdditionalInfo = (botDocument.AdditionalInfo || '') + "\n" + newInfo;
            await botDocument.save();
            console.log('Updated AdditionalInfo:', botDocument.AdditionalInfo);
        } else {
            console.log('Bot document not found');
        }
    }
}

async function botAvailability(botName, userID) {
    const botDocument = await bot.findOne({ 'personalInfo.Name': botName }); 
    if (botDocument) {
        if (botDocument.currentUser === userID || botDocument.currentUser === null) {
            return true
        } else {
            return false
        }
    }
}

// Function Call to load the bots
await loadBots();

// Starts the simulation
app.get('/', (req, res) => {
    simulation();
    res.send({ message: 'Simulation started' });
});

// Conversation with bot based on UserID
app.post('/conversation/:userID', async (req, res) => {
    const userID = req.params.userID;
    let response = '';
    const { message, botName } = req.body;
    console.log('Message:', message, 'Bot:', botName, 'UserID:', userID);
    
    const botDocument = await bot.findOne({ 'personalInfo.Name': botName }); 
        if (botDocument.currentUser === userID) {
            response = await ConverseWithBot(allBots[botName], botName, message, userID);
        } else if(botDocument.currentUser === null) {
                botDocument.currentUser = userID;
                await botDocument.save();
                response = await ConverseWithBot(allBots[botName], botName, message, userID);
        } else {
            response = 'Bot is currently busy. Please try again later.';
        }
    res.send({ response: response });
});

app.get('/fetchBots', (req, res) => {
    const botsData = Object.keys(allBots).map(key => {
        const bot = allBots[key];
        const DP = bot.persona && bot.persona.picture ? bot.persona.picture : null;
        const Profession = bot.persona && bot.persona.Profession ? bot.persona.Profession : null;
        return {
            name: key,
            profession: Profession,
            DP: DP,
        };
    });
    res.send({ bots: botsData });
});

app.get('/checkBotAvailability/:userID/:botName', async (req, res) => {
    const { botName, userID } = req.params;
    const isBotAvailable = await botAvailability(botName, userID);
    res.send({ available: isBotAvailable });
})

app.get('/fetchChatHistory/:userID/:botName', async (req, res) => {
    const { userID, botName } = req.params;
    const botDocument = await bot.findOne({ 'personalInfo.Name': botName });
    if (botDocument) {
        const userChatHistory = botDocument.ChatHistory.find(chat => chat.userID === userID);
        if (userChatHistory) {
            console.log(userChatHistory.chat)
            res.send({ chatHistory: userChatHistory.chat });
        } else {
            res.send({ chatHistory: [] });
        }
    } else {
        res.send({ chatHistory: [] });
    }
})

app.get('/endConversation/:userID/:botName', async (req, res) => {
    const { userID, botName } = req.params;
    const botDocument = await bot.findOne({ 'personalInfo.Name': botName }); 
    if (botDocument) {
        botDocument.currentUser = null;
        await botDocument.save();
    }
    console.log('Conversation ended between ', botName, ' and ', userID);
    res.send({ message: 'Conversation ended' });
})

process.on('SIGTERM',shutdown);
process.on('SIGINT',shutdown);



// Start the server
app.listen(PORT, () => {
    console.log(`Listening on Port ${PORT}...`);
});

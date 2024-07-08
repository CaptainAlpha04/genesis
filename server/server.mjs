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
mongoose.connect('mongodb://localhost:27017')
    .then(() => { console.log('Connected to MongoDB'); })
    .catch((err) => console.log(err));

// Generating a model for a bot
async function GenerateModel(prompt) {
    try {
        const model = await GeneratorModel(prompt || 'Generate a persona');
        if (model) {
            const DP = await generateImage(model.Gender, model.Ethnicity, model.Looks);
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

// await GenerateModel('Generate a caucasian male');
// await GenerateModel('Generate a palestinian woman');
// await GenerateModel('Generate a Asian American male');

// Generating a image for a bot
async function generateImage(gender, ethnicity, looks) {
    try {
        const prompt = `photorealistic profile picture of a beautiful ${ethnicity} ${gender}, and looks as ${looks}. Looking in the camera, normal background.`;
        const imageLinks = await generateImagesLinks(prompt);
        console.log(imageLinks);
        return imageLinks[1];
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

// Load all the bots from the database
let bots = {};
// Activates the bots
async function loadBots() {
    const botDocuments = await bot.find();
    if (botDocuments) {
        for (const botDocument of botDocuments) {
            const ActorBot = new ActorModel(botDocument.personalInfo);
            bots[botDocument.personalInfo.Name] = ActorBot;
            console.log(botDocument.personalInfo.Name + ' is Online...');
        }
    }
}

// Starts a conversation with a bot
async function startConversationWithBot(reqBody, userID) {
    const { userName, botName, message } = reqBody;
    const ActorBot = bots[botName];
    if (ActorBot) {
        console.log('Conversation between ' + userName + " with ID " + userID + ' and ' + botName);
        const response = await ConverseWithBot(ActorBot, botName, message, userID);
        delete bots[botName];
        return [ActorBot, response];
    } else {
        console.log('Bot not found');
        return [];
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

// Function Call to load the bots
await loadBots();

// Starts the simulation
app.get('/', (req, res) => {
    simulation();
    res.send({ message: 'Simulation started' });
});

// global variables to keep track of the conversation
let ConnectBot = false;
let ActorBot;
// Conversation with bot based on UserID
app.post('/conversation/:userID', async (req, res) => {
    const userID = req.params.userID;
    let response = '';
    const { message, botName } = req.body;
    console.log('Message:', message, 'Bot:', botName, 'UserID:', userID);
    if (ConnectBot) {
        response = await ConverseWithBot(ActorBot, botName, message || '', userID);
    } else {
        [ActorBot, response] = await startConversationWithBot(req.body, userID);
        ConnectBot = true;
    }
    res.send({ answer: `${response || "Conversation started"}` });
});

app.get('/fetchBots', (req, res) => {
    const botsData = Object.keys(bots).map(key => {
        const bot = bots[key];
        const DP = bot.persona && bot.persona.picture ? bot.persona.picture : null;
        return {
            name: key,
            DP: DP
        };
    });
    res.send({ bots: botsData });
});

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

// Start the server
app.listen(PORT, () => {
    console.log(`Listening on Port ${PORT}...`);
});

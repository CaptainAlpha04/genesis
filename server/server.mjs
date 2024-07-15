import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bot from './model/botSchema.mjs';
import { interBotConversation, shutdown, loadBots, allBots,
ConverseWithBot, checkBotAvailability, 
GenerateModel, generateUserImage} from './controller/logic.mjs';

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

// Function Call to load the bots
await loadBots();

// Starts the simulation
app.get('/', (req, res) => {
    simulation();
    res.send({ message: 'Simulation started' });
});


// await GenerateModel('Generate an Indian woman');
// await GenerateModel('Generate a caucasian male');
// await GenerateModel('Generate a palestinian woman');
// await GenerateModel('Generate a Asian American male');
// await GenerateModel('Generate a persona by the name of Neo, Arab by ethnicity, assistant and advisor to the creator Al,around the age of 25, has a background in everything, has a calm, friendly, helpful and compassionate personality, is extremely loyal to the creator, has good futuristic looks');

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

// Conversation with bot based on UserID
app.post('/simulation', async (req, res) => {
    const {botA, botB} = req.body;
    await interBotConversation(allBots[botA], allBots[botB]);
    res.send({ message: 'Simulation ended' });
});

app.get('/fetchBots/:userID', async (req, res) => {
    const { userID } = req.params;

    try {
        const allBots = await bot.find({ "personalInfo.Name": { $ne: "Neo" } });

        const botsData = allBots.map(bot => {
            const DP = bot.personalInfo.picture;
            const Profession = bot.personalInfo.Profession;
            const name = bot.personalInfo.Name;
            const userChatHistory = bot.ChatHistory.find(chat => chat.userID === userID);
            const relationship = Math.ceil(userChatHistory.relationship) ?? 0;
            return {
                name: name,
                profession: Profession,
                DP: DP,
                relationship: relationship
            };
        });

        res.send({ bots: botsData });
    } catch (error) {
        console.error('Error fetching bots:', error);
        res.status(500).send({ error: 'Error fetching bots' });
    }
});

app.get('/fetchAssistantBot/:userID', async (req, res) => {
    const { userID } = req.params;
    if(userID === process.env.CREATOR_USERID) {
        const assistantBot = await bot.findOne({ 'personalInfo.Name': 'Neo' });
        if (assistantBot) {
            const userChatHistory = assistantBot.ChatHistory.find(chat => chat.userID === userID);
            const relationship = Math.ceil(userChatHistory.relationship) ?? null;
            const botData = {
                name: assistantBot.personalInfo.Name,
                profession: assistantBot.personalInfo.Profession,
                DP: assistantBot.personalInfo.picture,
                relationship: relationship,
            };
            res.send({ bot: botData });
        } else {
            res.send({ bot: null });
        }
    } else {
        res.send({ bot: null });
    }    
})

app.get('/checkBotAvailability/:userID/:botName', async (req, res) => {
    const { botName, userID } = req.params;
    const isBotAvailable = await checkBotAvailability(botName, userID);
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

app.get('/logOut/:userID', async (req, res) => {
    const { userID } = req.params;
    const botDocument = await bot.findOne({ 'currentUser': userID });
    if (botDocument) {
        botDocument.currentUser = null;
        await botDocument.save();
    }
    console.log('Logged out ', userID);
    res.send({ message: 'Logged out' });
})

app.post('/generateUserImage', async (req, res) => {
    const {prompt} = req.body;
    const image = await generateUserImage(prompt);
    res.send({ image });
})

// Start the server
app.listen(PORT, () => {
    console.log(`Listening on Port ${PORT}...`);
});

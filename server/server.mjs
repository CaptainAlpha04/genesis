import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bot from './model/botSchema.mjs';
import { shutdown, loadBots, allBots,
ConverseWithBot, checkBotAvailability } from './controller/logic.mjs';

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
    let responseA = 'you are now connected to Arthur, start the conversation';
    let responseB = '';
    console.log('Connected..')
    while(true) {
        responseA = await ConverseWithBot(allBots[botA], botA, responseB, 'arthur');
        console.log('Response A:', responseA);
        responseB = await ConverseWithBot(allBots[botB], botB, responseA, 'anjali');
        console.log('Response B:', responseB);
    }
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



// Start the server
app.listen(PORT, () => {
    console.log(`Listening on Port ${PORT}...`);
});

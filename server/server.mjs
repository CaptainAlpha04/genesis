import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import {exec} from 'child_process';
import { fileURLToPath } from 'url';
import {dirname} from 'path';
import { writeFileSync, unlink, promises as fsPromises } from 'fs';
import bot from './model/botSchema.mjs';
import { interBotConversation, shutdown, loadBots, allBots,
checkBotAvailability, handleBotConversation, handleCommandConversation,
GenerateModel, generateUserImage} from './controller/logic.mjs';
import { checkifCommandExist, generateCode, ImageInterpreter } from './functions/Commands.mjs';
import path from 'path';

dotenv.config();


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Middlewares
const app = express();
const PORT = process.env.PORT || 8000;
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb'}));
app.use(cors());
app.use(bodyParser.json());
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

// await GenerateModel('Generate a south-american medical doctor persona')
// await GenerateModel('Generate an Indian woman');
// await GenerateModel('Generate a caucasian male');
// await GenerateModel('Generate a palestinian woman');
// await GenerateModel('Generate a Asian American male');

// Conversation with bot based on UserID
app.post('/conversation/:userID', handleConversation);

async function handleConversation(req, res) {
    const userID = req.params.userID;
    let response = '';
    const { message, botName } = req.body;
    console.log('Message:', message, 'Bot:', botName, 'UserID:', userID);

    const commandResult = await checkifCommandExist(message);
    if (commandResult) {
        response = await handleCommandConversation(commandResult, botName, userID);
        console.log(response);
    } else {
        response = await handleBotConversation(botName, message, userID);
        console.log(response);
    }

    res.send({ response: response });
}

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
            const relationship = userChatHistory ? Math.ceil(userChatHistory.relationship) : 0; // Default to 0 if undefined
            return {
                name: name,
                profession: Profession,
                DP: DP,
                relationship: relationship,
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

app.post('/generateCode', async (req, res) => {
    const {code, message, language} = req.body;
    const snippet = await generateCode(language, code, message);
    res.send({ snippet });
})


app.post('/execute', async (req, res) => {
    const { language, code } = req.body;

    let filePath;
    let command;

    try {
        switch (language) {
            case 'javascript':
                filePath = path.join(__dirname, 'temp.js');
                await fsPromises.writeFile(filePath, code);
                console.log('File written:', filePath);
                command = `node "${filePath}"`;
                break;
            case 'python':
                filePath = path.join(__dirname, 'temp.py');
                await fsPromises.writeFile(filePath, code);
                console.log('File written:', filePath);
                command = `python "${filePath}"`;
                break;
            case 'java':
                filePath = path.join(__dirname, 'Main.java');
                await fsPromises.writeFile(filePath, code);
                console.log('File written:', filePath);
                command = `javac "${filePath}" && java Main`;
                break;
            case 'cpp':
                filePath = path.join(__dirname, 'main.cpp');
                await fsPromises.writeFile(filePath, code);
                console.log('File written:', filePath);
                command = 'g++ main.cpp -o && main.exe';
                break;
            case 'typescript':
                filePath = path.join(__dirname, 'temp.ts');
                await fsPromises.writeFile(filePath, code);
                console.log('File written:', filePath);
                command = `ts-node "${filePath}"`;
                break;
            default:
                return res.status(400).send('Unsupported language');
        }

        // Log command execution
        console.log('Executing command:', command);

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Execution error: ${stderr || error.message}`);
                return res.status(500).send(`Error: ${stderr || error.message}`);
            }
            res.send(stdout);
        });
    } catch (error) {
        console.error(`Internal server error: ${error.message}`);
        res.status(500).send(`Internal Server Error: ${error.message}`);
    } finally {
        // Cleanup temporary files
        const tempFiles = ['temp.js', 'temp.py', 'Main.java', 'main.cpp', 'temp.ts', 'main.exe'];
        for (const file of tempFiles) {
            const tempFilePath = path.join(__dirname, file);
            try {
                await new Promise(resolve => setTimeout(resolve, 2000));
                await fsPromises.access(tempFilePath).then(() => fsPromises.unlink(tempFilePath))
                    .then(() => console.log(`Deleted file: ${file}`))
                    .catch(err => {
                        if (err.code === 'ENOENT') {
                            // Do nothing
                        } else {
                            console.error(`Failed to delete ${file}: ${err.message}`);
                        }
                    });
            } catch (err) {
                console.error(`Failed to delete ${file}: ${err.message}`);
            }
        }
    }
});

// Convert drawings to images using Bing
app.post('/convertGraphic/:prompt', async (req, res) => {
    const { image } = req.body;
    const prompt = req.params.prompt;
    const base64Data = image.replace(/^data:image\/png;base64,/, "");
    const fileName = 'image.png';
    const filePath = path.join(__dirname, fileName);

    try {
      // Save the image file
        await fsPromises.writeFile(filePath, base64Data, 'base64');
        console.log('File written:', filePath);

      // Interpret the image
        const interpretation = await ImageInterpreter(filePath, prompt);
        console.log(interpretation);
      // Clean up the image file after interpretation
        await fsPromises.unlink(filePath);
        
        if(interpretation) {
            const result = await generateUserImage(interpretation);
            console.log(result);
            res.send({ image: result });
        } else {
            res.send({image: null});
        } 

    } catch (error) {
        console.error('Error processing image:', error);
        res.status(500).send('Error processing image.');
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Listening on Port ${PORT}...`);
});

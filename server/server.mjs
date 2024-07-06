import express from 'express'
import { GeneratorModel } from './middleware/GeneratorModel.mjs'
import ActorModel from './middleware/ActorModel.mjs'
import botSchema from './model/botSchema.mjs'
import mongoose from 'mongoose'
import cors from 'cors'
import dotenv from 'dotenv'
import bot from './model/botSchema.mjs'
dotenv.config()

// Middlewares
const app = express()
const PORT = process.env.PORT || 8000
app.use(express.json())
app.use(cors())

// Connecting to MongoDB database
mongoose.connect('mongodb://localhost:27017')
.then(()=> {console.log('Connected to MongoDB')})
.catch((err) => console.log(err))

// Generating a model for a bot
async function GenerateModel(prompt) {
    try {
        const model = await GeneratorModel(prompt || 'Generate a persona');
        if (model) {
            const newBot = new bot({
                personalInfo:{
                    Name: model.Name,
                    Age: model.Age,
                    Ethnicity: model.Ethnicity,
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
                    Bad_Traits: model.Bad_Traits
                }
            });

            await newBot.save();
            console.log('Data saved successfully:', newBot);
        } else {
            console.error('Model does not have the expected structure:', model);
        }
    } catch (error) {
        console.log('Error generating model:', error)
    }
}

// Simulation of a conversation between two bots
async function simulation() {
    const personA = await GeneratorModel('Generate a persona');
    const personB = await GeneratorModel('Generate a persona');
    console.log(personA, personB)

    // Initializing two actor models objects
    const ActorA = new ActorModel(personA)
    const ActorB = new ActorModel(personB)

    let responseA = '';
    let responseB = '';
    
    console.log('Conversation between personA and personB')
    while(true) {
        responseA = await ActorA.callActorModel(responseB)
        console.log('PersonA:', responseA)
        responseB = await ActorB.callActorModel(responseA)
        console.log('PersonB:', responseB)
    }
}


let firstTime = true
// Conversation between a bot and a human
async function conversation(message) {
    if (firstTime) {
        const bot = await GeneratorModel('Generate a persona')
        ActorBot = new ActorModel(bot)
        firstTime = false
    }

    return await ActorBot.callActorModel(message)
}


// Load all the bots from the database
let bots = {}
// Activates the bots
async function loadBots() {
    bots = await bot.find()
    if(bots) {
        for (const bot of bots) {
            const ActorBot = new ActorModel(bot.personalInfo)
            bots[bot.personalInfo.Name] = ActorBot
            console.log(bot.personalInfo.Name + ' is Online...')
        }
    }
}

async function startConversationWithBot(reqBody) {
    const {userID, userName, botName, message} = reqBody
    const ActorBot = bots[botName]
    const allBots = {...bots}
    bots = allBots.filter(bot => bot.personalInfo.Name !== botName)
    if(ActorBot) {
        console.log('Conversation between ' + userName + " with ID " + userID + ' and ' + botName)
        ConverseWithBot(ActorBot, message)
        return ActorBot
    } else {
        console.log('Bot not found')
        return null
    }
}

async function ConverseWithBot(ActorBot, message) {
    const response = await ActorBot.callActorModel(message)
    console.log('Bot:', response)
    // Save the conversation to the database

}


await loadBots()

app.get('/', (req, res) => {
    simulation()
    res.send({ message: 'Simulation started' })
})

let ConnectBot = false
let ActorBot

app.post('/conversation', async (req, res) => {
    if (ConnectBot) {
        const {message} = req.body;
        ConverseWithBot(ActorBot, message || '')
    } else {
        ActorBot = await startConversationWithBot(req.body)
        console.log(ActorBot)
        ConnectBot = true
    }
    res.send({message: 'Conversation started'})
})

app.post('/convo', async (req, res) => {
    const message = req.body.message
    console.log(`User: ${message}`)
    const response = await conversation(message)
    console.log(`Bot: ${response}`)
    //GenerateModel(message)
    res.send({ message: `${response || "Conversation started"}` })
    //res.send({message: 'Conversation started'})
})

app.listen(PORT, () => {
    console.log(`Listening on Port ${PORT}...`)
})
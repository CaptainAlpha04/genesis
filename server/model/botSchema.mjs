import mongoose from 'mongoose';

const infoSchema = new mongoose.Schema({
    value: String,
    source: String  // e.g., 'bot', 'user'
});

const chatHistorySchema = new mongoose.Schema({
    userID: String,
    chat: [
        { user: String, bot: String }
    ]
});

const botSchema = new mongoose.Schema({
    personalInfo: {
        Name: String,
        Age: Number,
        Gender: String,
        Ethnicity: String,
        Education: String,
        Profession: String,
        SkillSet: [String],
        Hobbies: [String],
        Interests: [String],
        Looks: String,
        Mood: String,
        Religion: String,
        Nationality: String,
        Personality: String,
        Good_Traits: [String],
        Bad_Traits: [String],
        role: { type: String, default: 'citizen' },
        username: String,
        picture: String
    },
    AdditionalInfo: [infoSchema],
    ChatHistory: [chatHistorySchema],
    currentUser: { type: String, default: "" },
});

const bot = mongoose.model('Bot', botSchema);

export default bot;

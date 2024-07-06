import mongoose from 'mongoose';

const botSchema = new mongoose.Schema({
    personalInfo: {
        Name: String,
        Age: Number,
        Ethnicity: String,
        Education: String,
        Profession: String,
        SkillSet: [String], // Updated to be an array of strings
        Hobbies: [String],
        Interests: [String],
        Looks: String,
        Mood: String,
        Religion: String,
        Nationality: String,
        Personality: String,
        Good_Traits: [String],
        Bad_Traits: [String],
    },
    AdditionalInfo: {
        type: String,
    },
    ChatHistory: {
        UserID: String,
        chats: [
            {
                message: String,
                time: String,
                sender: String,
            }
        ]
    }
});

const bot = mongoose.model('Bot', botSchema);
export default bot;

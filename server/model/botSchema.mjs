import mongoose from 'mongoose';

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
    AdditionalInfo: {
        type: String,
    },
    ChatHistory: [
        {
            userID: String,
            chat: [
                { user: String, bot: String }
            ]
        }
    ],
    currentUser: { type: String, default: null },

});

const bot = mongoose.model('Bot', botSchema);
export default bot;

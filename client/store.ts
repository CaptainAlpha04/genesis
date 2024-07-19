import { configureStore, createSlice } from '@reduxjs/toolkit';

const botReplySlice = createSlice({
    name: 'botReply',
    initialState: {
    botReply: null,
    },
    reducers: {
        setBotReply: (state, action) => {
            state.botReply = action.payload;
            },
    },
});

const languageSlice = createSlice({
    name: 'language',
    initialState: {
    language: null, 
    },
    reducers: {
        setLanguage: (state, action) => {
            state.language = action.payload;
            },
    },
});


export const { setBotReply } = botReplySlice.actions;
export const { setLanguage } = languageSlice.actions;

const store = configureStore({
    reducer: {
        botReply: botReplySlice.reducer,
        language: languageSlice.reducer,
    },
});

export default store;

'use client'
import React from 'react'
import { Provider} from 'react-redux';
import store from '../../store';
import Cybernauts from '../components/Cybernauts';

function Page() {
    return (
        <Provider store={store}>
            <Cybernauts />
        </Provider>
    )
}

export default Page;

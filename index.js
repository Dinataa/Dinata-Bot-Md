import baileys from '@adiwajshing/baileys'
import P from "pino"
import {
    Boom
} from '@hapi/boom'
import * as fs from 'fs'

const {
    state,
    saveState
} = baileys.useSingleFileAuthState('./auth.json')
const store = baileys.makeInMemoryStore({
    logger: P().child({
        level: 'debug',
        stream: 'store'
    })
})

async function connectToWhatsApp() {
    const sock = baileys.default({
        printQRInTerminal: true,
        logger: P({
            level: 'debug'
        }),
        auth: state
    })    

    sock.ev.on("connection.update", update => {
        const {
            connection,
            lastDisconnect
        } = update
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect.error?.output?.statusCode !== baileys.DisconnectReason.loggedOut
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect)
           
            if (shouldReconnect) {
                connectToWhatsApp()
            }
        } else if (connection === 'open') {
            console.log('opened connection')
        }
    })
    
    sock.ev.on('creds.update', () => saveState)    
    sock.ev.on('messages.upsert', m => {
       console.log(JSON.stringify(m, undefined, 2))
    })
}

connectToWhatsApp()

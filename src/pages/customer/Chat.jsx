import React, { useState } from 'react'
import { useEffect } from 'react'
import { getUserSessions, getMessages } from '../../api/chat'

// code here runs before loading the component 


export default function Chat () {

    // declare the states 
    const [ messages, setMessages ] = useState([])
    const [ activeSession, setActiveSession ] = useState(null)
    const [ loading, setLoading ] = useState(false)
    const [ sessions, setSessions ] = useState([])
    const [ input, setInput ] = useState("")
    

    useEffect(() => {
    // useEffect cant be async 

        async function fetchSessions () {
            const sessions = await getUserSessions()
            setSessions(sessions.data.sessions)
        }
        fetchSessions()
    }, [])

    useEffect(() => {
        if (!activeSession) {
            return
        }
        async function fetchSessionMessages(session) {
            const messages = await getMessages(session)
            setMessages(messages.data.messages)
        }
        fetchSessionMessages(activeSession)
    }, [activeSession])


  return (
    <div className='flex flex-row'>
        <div className='' id='sidebar'>
            <div>
                <h1>ShopDesk</h1>
            </div>

            <div>
                <button>New chat</button>
            </div>

            <div className='' id='session-list'>

            </div>
        </div>


        <div className='flex flex-col' id='main'>
            <div className='' id='messages-area'>

            </div>

            <div id='submit-btn-area'>

            </div>

        </div>
    </div>
  )
}

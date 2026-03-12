import React, { useState } from 'react'
import { useEffect } from 'react'
import { getUserSessions, getMessages, createSession, sendMessage } from '../../api/chat'

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
            setSessions(sessions.data)
        }
        fetchSessions()
    }, [])

    useEffect(() => {
        if (!activeSession) {
            return
        }
        async function fetchSessionMessages(session) {
            const messages = await getMessages(session)
            setMessages(messages.data)
        }
        fetchSessionMessages(activeSession)
    }, [activeSession])

    // new session creation handler 
    async function handleNewChat (event) {
        const response = await createSession()
        const newSession = response.data
        setSessions([...sessions, newSession])
        setActiveSession(newSession.session_id)
    }

    function handleSelectSession (sessionId) {
        setActiveSession(sessionId)
    }

    async function handleSendMessage () {
        if (!input){
            return
        }
        try {
            setLoading(true)
            const response = await sendMessage(activeSession, input)
            const aiMessage = {content: response.data.response, role: "assistant"}
            // clearing the input
            setInput("")
            // append the response message to messages
            const humanMessage = {content: input, role: "user"}
            setMessages([...messages, humanMessage, aiMessage])

        } finally {
            setLoading(false)
        }
    }


  return (
    <div className='flex flex-row h-screen overflow-hidden'>
        <div className='w-64 h-full bg-[#0F172A] flex flex-col p-4' id='sidebar'>
            <div>
                <h1 className='text-white text-lg font-semibold mb-6'>ShopDesk</h1>
            </div>

            <div>
                <button className="w-full py-2 rounded-lg text-sm font-medium
                bg-[#1E293B] text-white
                hover:bg-[#334155] transition-colors mb-4" onClick={handleNewChat}>New chat</button>
            </div>

            <div className='' id='session-list'>
                {
                    sessions.map((session, index) => (
                        <div className={`px-3 py-2 rounded-lg text-sm cursor-pointer transition-colors
                        ${session.session_id === activeSession 
                        ? 'bg-[#1E293B] text-white' 
                        : 'text-[#94A3B8] hover:bg-[#1E293B]'}`} key={index} onClick={() => handleSelectSession(session.session_id)}>
                            Chat {index + 1}
                        </div>
                    ))
                }
            </div>
        </div>


        <div className='flex flex-col flex-1 bg-[#F8FAFC] overflow-hidden' id='main'>
            <div className='flex-1 overflow-y-auto p-6 flex flex-col gap-3' id='messages-area'>
                {!activeSession && (
                    <div className='align-right'>
                        <p className='h-full flex items-center justify-center
                        text-[#64748B] text-sm'>Enter a text to start chatting</p>
                    </div>
                )}

                {messages.map((message, index) => (
                    (message.role === "user") ? <div key={index} className='align-right self-end bg-[#2563EB] text-white
                    px-4 py-2.5 rounded-2xl rounded-br-sm
                    max-w-lg text-sm'>{message.content}</div> : <div key={index} className='align-left self-start bg-white text-[#0F172A]
                    px-4 py-2.5 rounded-2xl rounded-bl-sm
                    max-w-lg text-sm shadow-sm border border-slate-200'>{message.content}</div>
                ))}
            </div>

            <div id='submit-btn-area' className='border-t border-slate-200 p-4 bg-white flex gap-3 items-end'>
                <textarea className='flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500' name="input-text" id="query" value={input} cols={40} rows={3} placeholder='type your query here' onChange={e => setInput(e.target.value)}/>

                <button className='px-5 py-3 rounded-xl text-sm font-medium bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors disabled:opacity-50' disabled={loading} onClick={handleSendMessage}>
                    {loading? "sending" : "send"}
                </button>
            </div>

        </div>
    </div>
  )
}

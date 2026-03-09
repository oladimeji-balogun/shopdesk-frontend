import React, { useState } from 'react'

export default function Chat () {

    // declare the states 
    const [ messages, setMessages ] = useState([])
    const [ activeSession, setActiveSession ] = useState(null)
    const [ loading, setLoading ] = useState(false)
    const [ sessions, setSessions ] = useState([])
    const [ input, setInput ] = useState("")

  return (
    <div className='flex flex-row'>
        <div className='sidebar'>

        </div>

        <div className='main'>

        </div>
    </div>
  )
}

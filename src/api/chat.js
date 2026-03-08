import axios from "axios";

const chatBaseUrl = "http://localhost:8000/chat"
const sessionBaseUrl = "http://localhost:8000/sessions"

// function to get all messages
async function getMessages ( session_id ) {
    const url = sessionBaseUrl + `/${session_id}/messages`;
    try {
        const messages = await axios.get(url, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("access-token")}`
            }
        }) 
        console.log(messages)
        return messages
        
    } catch (error) {
        console.log(error)
    }
}

// function to get all the user sessions 
async function  getUserSessions (user_id) {
    const url = sessionBaseUrl + `/${user_id}/sessions`; 

    try {

    
        const sessions = await axios.get(url, 
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("access-token")}`
                }
            }
        )

        return sessions
    } catch (error) {
        console.log(error)
    }
}

// function to send a message 
async function sendMessage (session_id, message) {
    const url = chatBaseUrl + `/${session_id}`; 
    try {
        const response = await axios.post(url, {content: message}, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("access-token")}`
            }
        })
        return response 
    } catch (error) {
        console.log(error)
    }
}

async function createSession () {
    try {
        const session = await axios.post(sessionBaseUrl, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("access-token")}`
            }
        })
    } catch (error) {
        console.log(error)
    }
}
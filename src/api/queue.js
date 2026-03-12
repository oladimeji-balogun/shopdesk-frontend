import axios from "axios";
const baseUrl = "http://localhost:8000/queue"; 


// the api to get all the tickets on the queue
export async function getTickets() {
    try {
        const response = await axios.get(baseUrl, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("access-token")}`
            }
        })
        return response.data 
    } catch (error) {
        console.log(error)
    }
}

// the api to update a ticket a record on the tickets database 

export async function updateTicket( ticket_id, status ) {
    try {
        const url = baseUrl + `/${ticket_id}`; 

        const update = await axios.patch(url, {
            status: status
        }, {
            headers: {Authorization: `Bearer ${localStorage.getItem("access-token")}`}
        })

        return update.data
    } catch (error) {
        console.log(error)
    }
}
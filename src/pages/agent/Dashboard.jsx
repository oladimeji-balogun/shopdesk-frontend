import React, { useEffect, useState } from 'react'
import { getTickets, updateTicket } from '../../api/queue';

export default function Dashboard() {
    const [ tickets, setTickets ] = useState([]);
    const [ loading, setLoading ] = useState(false);

    // use effect to fetch all the tickets 
    useEffect(() => {
        async function fetchTickets () {
            const tickets = await getTickets();
            setTickets(tickets)
        }
        fetchTickets();
    }, [])

    // handler for updating ticket status
    async function handleUpdateStatus( ticketId, status ){
        const update = await updateTicket(ticketId, status);
        // update the ticket 
        setTickets(tickets.map((ticket, index) => 
            ticket.ticket_id === ticketId ? {...ticket, ticket_status: status} : ticket
        ))
        
    }
    return (
        <div>

        </div>
    )
}

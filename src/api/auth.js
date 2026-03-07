import axios from "axios"

const url = "http://localhost:8000/auth/login";

export async function loginUser ( email, password ) {
    try {
        const response = await axios.post(url, {
            "email": email, 
            "password": password
        })
        return response
    } catch (error) {
        console.log(error);
    }
}
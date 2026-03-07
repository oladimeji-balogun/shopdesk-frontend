import axios from "axios"

const url = "http://localhost:8000/auth";

export async function loginUser ( email, password ) {
    try {
        const response = await axios.post(url + "/login", {
            "email": email, 
            "password": password
        })
        return response
    } catch (error) {
        console.log(error);
    }
}


export async function registerUser (name, email, phone, password) {
    try {
        const response = await axios.post(url + "/register", {
            "email": email, 
            "phone": phone, 
            "password": password, 
            "name": name 
        })

        return response;
    } catch (error) {
        console.log(error); 
    }
}
import axios from "axios"

url="http://localhost:8000/auth/login";

export async function LoginUser ( email, password ) {
    await axios.post(url, {
        "email": email, 
        "password": password
    }).then(function (response) {
        console.log("login successful");
        return response;
    }).catch(function (error) {
        console.log(error);
    })
}
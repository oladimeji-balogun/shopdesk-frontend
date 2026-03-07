

import React, { useState } from 'react'
import { loginUser } from '../../api/auth';
import { useNavigate } from 'react-router-dom';

function Login() {
    const navigate = useNavigate();

    const [ email, setEmail ] = useState(""); 
    const [ password, setPassword ] = useState(""); 
    const [ loading, setLoading ] = useState(false);
    const [ error, setError ] = useState("");

    // function to handle submision
    async function handleSubmit ( event ) {
        event.preventDefault();
        setLoading(true);
        // the login logic
        try {
            let response = await loginUser(email, password);
            console.log(response);
            localStorage.setItem("access-token", response.data.access_token);

            const role = response.data.role; 
            if (role === "customer") {
                navigate("/chat")
            } else {
                navigate("/agent/dashboard")
            }
        } catch (error) {
            setError("invalid email or password");
        } finally {
            setLoading(false);
        }
    }

  return (
    <div>
        <form onSubmit={handleSubmit}>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
            <input type="password"  value={password} onChange={e => setPassword(e.target.value)}/>
            <button type='submit'>{loading ? "Logging in" : "Log in"}</button>
        </form>
        {error}
    </div>
  )
}

export default Login
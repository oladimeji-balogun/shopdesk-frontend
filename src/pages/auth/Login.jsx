

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
            if (role === "CUSTOMER") {
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
    <div className='flex  w-full bg-[#F8FAFC] min-h-screen items-center justify-center'>
        <div className='rounded-xl shadow-sm border w-full max-w-md p-8'>
            <h1 className='text-2xl font-semibold tracking-tight text-[#0F172A]'>ShopDesk</h1>
            <p className='text-sm text-[#64748B] mt-1'>sign in to your account</p>

        <form onSubmit={handleSubmit} className='mt-6 flex flex-col gap-4'>

            <div>
                <label htmlFor="email" className='text-xs font-medium uppercase tracking-wide text-[#64748B]'>Email</label>

                <input type="email" id='email' className='w-full px-4 py-2.5 rounded-lg border border-slate-200
                text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500' value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
                <label htmlFor="password" className='text-xs font-medium uppercase tracking-wide text-[#64748B]'>Password</label>
                <input type="password" id='password' className='w-full px-4 py-2.5 rounded-lg border border-slate-200
                text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-blue-500' value={password} onChange={e => setPassword(e.target.value)}/>
            </div>
            <button type='submit' disabled={loading} className='bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors duration-150 w-full py-2.5 rounded-lg font-medium text-sm'>{loading ? "Logging in" : "Log in"}</button>
        </form>
        {error && <p className='text-sm text-[#EF4444]'>{error}</p>}
        </div>
        
    </div>
  )
}

export default Login


import React, { useState } from 'react'
import { registerUser } from '../../api/auth'
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
    const navigate = useNavigate();
    
    // declare the states 
    const [ name, setName ] = useState("");
    const [ email, setEmail ] = useState("");
    const [ password, setPassword ] = useState("");
    const [ phone, setPhone ] = useState(""); 
    const [ loading, setLoading ] = useState(false); 
    const [ error, setError ] = useState("");

    async function handleSubmit( event ) {
        event.preventDefault(); 
        setLoading(true);
        try {
            const response = await registerUser(name, email, phone, password);

            console.log(response);
            localStorage.setItem("access-token", response.data.access_token)
            navigate("/chat");
        } catch (error) {
            // console.log("could not register user");
            setError("user registration failed!");
        } finally {
            setLoading(false);
        }
    }

    return (
    <div className='flex  w-full bg-[#F8FAFC] min-h-screen items-center justify-center'>
        <div className='rounded-xl shadow-sm border w-full max-w-md p-8'>
            <h1 className='text-2xl font-semibold tracking-tight text-[#0F172A]'>ShopDesk</h1>

            <p className='text-sm text-[#64748B] mt-1'>create a new account</p>
            <form className='mt-6 flex flex-col gap-4 w-full' onSubmit={handleSubmit}>
                <div className='flex flex-col gap-1'>
                    <label htmlFor="name" className='text-left text-xs font-medium uppercase tracking-wide text-[#64748B]'>Name</label>
                    <input type="text" name="name" value={name} id="name"   className='w-full px-4 py-2.5 rounded-lg border   border-slate-200
                    text-sm text-[#0F172A] focus:outline-none focus:ring-2  focus:ring-blue-500' onChange={e => setName(e.target.    value)}/>
                </div>
                

                <div className='flex flex-col gap-1'>
                    <label htmlFor="email" className='text-left text-xs font-medium uppercase tracking-wide text-[#64748B]'>Email</label>
                    <input type="email" name="email" value={email}  id="email" className='w-full px-4 py-2.5 rounded-lg  border border-slate-200
                    text-sm text-[#0F172A] focus:outline-none focus:ring-2  focus:ring-blue-500' onChange={e => setEmail(e.target.   value)}/>
                </div>

                <div className='flex flex-col gap-1'>
                    <label htmlFor="phone" className='text-left text-xs font-medium uppercase tracking-wide text-[#64748B]'>Phone</label>
                    <input type="tel" name="phone" value={phone}    id="phone" className='w-full px-4 py-2.5 rounded-lg    border border-slate-200
                    text-sm text-[#0F172A] focus:outline-none focus:ring-2  focus:ring-blue-500' onChange={e => setPhone(e.target.   value)}/>
                </div>

                <div className='flex flex-col gap-1'>
                    <label htmlFor="password" className='text-left text-xs font-medium uppercase tracking-wide text-[#64748B] align-start'>Password</label>
                    <input type="password" name="password" value=   {password} id="password" className='w-full px-4 py-2.5     rounded-lg border border-slate-200
                    text-sm text-[#0F172A] focus:outline-none focus:ring-2  focus:ring-blue-500' onChange={e => setPassword(e.   target.value)}/>
                </div>

                
                <button type="submit" disabled={loading} className='bg-[#2563EB] text-white hover:bg-[#1D4ED8] transition-colors duration-150 w-full py-2.5 rounded-lg font-medium text-sm'>
                    {loading ? "Registering User": "Register"}
                </button>
            </form>
            {error && <p className='text-sm text-[#EF4444]'>{error}</p>}

            <p className='text-sm text-[#64748B] mt-4 text-center'>Already have an account?{" "}
                <Link to="/" className='text-[#2563EB] font-medium hover:underline'>Login</Link>
            </p>

            
        </div>
    </div>
  )
}


import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import Chat from './pages/customer/Chat'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login/>} />
        <Route path='/register' element={<Register/>}/>
        <Route path='/chat' element={<Chat />}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App

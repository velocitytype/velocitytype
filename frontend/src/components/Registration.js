import React, { useState, useEffect } from "react";
import Header from "./Header";
import '../style/register.css';
import {useNavigate} from "react-router-dom"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// This component handles user registration and login
function Registration(){
    // navigate to redirect to another path
    const navigate = useNavigate();
    const [twoFa, setTwoFa] = useState(false)
    // if user is already log in, then redirect to /profile
    useEffect(() => {
        const vt_login = window.localStorage.getItem("vt_login")
        if (vt_login === "true"){
            navigate("/profile");
        }
    }, [])

    // handle's register, sends data to the server and receives response
    const handleRegister = (e) => {
        e.preventDefault()
        const username = e.target[0].value
        const email = e.target[1].value
        const password = e.target[2].value
        const confirmPassword = e.target[3].value
        if (password != confirmPassword){
            toast.error("Passwords must match")
            return
        }
        const payload = {name: username, email: email, password: password}
        fetch("http://127.0.0.1:5000/register", {
            credentials: "include",
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload)
        }).then(res => res.json())
        .then(r => {
            if (r.message === "User registered successfully"){
                // if user is successfully registered, set login to true
                window.localStorage.setItem("vt_login", "true")
                toast.success("Registration successful")
                navigate("/profile")
            } else {
                toast.error(r.message)
            }
        })
        .catch(e => {
            toast.error(e.toString())
        })
    }

    // handles login, sends data to the server and receives response
    const handleLogin = (e) => {
        e.preventDefault();
        const username = e.target[0].value;
        const password = e.target[1].value;
        const payload = {name: username, password: password}
        if (twoFa){
            const otp = e.target[2].value;
            fetch("http://127.0.0.1:5000/verify-two-factor", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({"name": username, "otp": otp})
            })
            .then(res => res.json())
            .then(data => {
                if (data.message === "User logged in successfully"){
                    // if user is successfully registered, set login to true
                    window.localStorage.setItem("vt_login", "true")
                    toast.success("Login successful");
                    navigate("/profile")
                } else {
                    toast.error(data.message)
                }
            })
            .catch(e => toast.error(e.toString()))
            return;
        }
        fetch("http://127.0.0.1:5000/login", {
            credentials: "include",
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(payload)
        }).then(res => res.json())
        .then(r => {
            if (r["message"] === "2FA is enabled"){
                setTwoFa(true)
                toast.success("Enter 2FA OTP to proceed")
                return;
            }
            if (r.message === "User logged in successfully"){
                // if user is successfully registered, set login to true
                window.localStorage.setItem("vt_login", "true")
                toast.success("Login successful");
                navigate("/profile")
            } else {
                toast.error(r.message)
            }
        })
        .catch(e => {
            toast.error(e.toString())
        })
    }
    return (
        <>
            <Header />
            <div className="register-body">
                <div className="register-form-wrapper">
                    <h1>Register</h1>
                    <form id="register-form" onSubmit={(e) => handleRegister(e)}>
                        <section>
                            <input type="text" placeholder="Username" />
                            <input type="email" placeholder="Email" />
                            <input type="password" placeholder="Password" />
                            <input type="password" placeholder="Confirm password" />
                        </section>
                        <button type="submit">Register</button>
                    </form>
                </div>
                <div className="login-form-wrapper">
                    <h1>Login</h1>
                    <form id="login-form" onSubmit={(e) => handleLogin(e)}>
                        <section>
                            <input type="text" placeholder="Username" />
                            <input type="password" placeholder="Password" />
                            {twoFa ? <input type="number" placeholder="2FA OTP" /> : ""}
                        </section>
                        <button type="submit">Login</button>
                    </form>
                </div>
            </div>
            <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} newestOnTop={true} closeOnClick rtl={false} pauseOnHover theme="dark"/>
        </>
    )
}

export default Registration;
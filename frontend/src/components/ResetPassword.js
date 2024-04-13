import React, { useRef } from "react";
import {useLocation, useNavigate} from "react-router-dom";
import Header from "./Header";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../style/resetpassword.css';

function ResetPassword(){
    const newPassRef = useRef(null);
    const confirmNewPassRef = useRef(null);
    let { search } = useLocation();
    const navigate = useNavigate()

    const query = new URLSearchParams(search);
    const token = query.get('token');

    function resetPassword(){
        const newPass = newPassRef.current.value;
        const confirm = confirmNewPassRef.current.value;
        if (newPass !== confirm){
            toast.error("Passwords do not match")
            return
        }
        fetch("http://127.0.0.1:5000/reset-password", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({"token": token, "password": newPass})
        })
        .then(res => res.json())
        .then(data => {
            if (data.message === "Password changed successfully"){
                toast.success(data.message)
                navigate("/register")
                return
            }
            toast.error(data.message)
        })
        .catch(e => toast.error(e.toString()))
    }
    return (
        <>
            <Header />
            <div className="reset-password-wrapper">
                <h1>Reset Password</h1>
                <input type="password" placeholder="New Password" ref={newPassRef} />
                <input type="password" placeholder="Confirm New Password" ref={confirmNewPassRef} />
                <button onClick={resetPassword}>Reset Password</button>
            </div>
            <ToastContainer position="top-right" autoClose={2500} hideProgressBar={false} newestOnTop={true} closeOnClick rtl={false} pauseOnHover theme="dark"/>
        </>
    )
}

export default ResetPassword
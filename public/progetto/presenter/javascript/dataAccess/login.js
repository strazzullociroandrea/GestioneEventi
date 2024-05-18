export const login = (socket, emailTemp) =>{
    const user = sessionStorage.getItem("email");
    const password = sessionStorage.getItem("password");
    if (user && user !== "" && password && password !== "") {
        socket.emit("login", {
            email: emailTemp || user,
            password: password,
        });
    } else {
        window.location.href = "./login.html";
    }
}
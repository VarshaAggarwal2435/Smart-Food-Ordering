let btn = document.querySelector("#role");
btn.addEventListener("click", (event)=>{
    if(btn.textContent == "Staff Login")
        btn.textContent = "Student Login";
    else
        btn.textContent = "Staff Login";
    event.preventDefault();
});


function increase(event) {
    let clickEl = event.target.parentElement.previousElementSibling.id;
    let count = document.getElementById(clickEl).textContent;
    if(count<6)
    count++;
    document.getElementById(clickEl).textContent = count;
}

function decrease(event) {
    let clickEl = event.target.parentElement.nextElementSibling.id;
    let count = document.getElementById(clickEl).textContent;
    if(count>1)
        count--;
    document.getElementById(clickEl).textContent = count;
}
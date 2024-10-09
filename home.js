
function leftScroll() {
    const element = document.getElementsByClassName("scroll-images");
    // element.scrollBy({ top: 50, left: 50, behavior: "smooth" });
    // const left = document.querySelector(".scroll-images");
    // left.scrollBy(200, 0);
    element.scrollLeft += 50;
}
function rightScroll() {
    const right = document.querySelector(".scroll-images");
    right.scrollBy(-200, 0);
}
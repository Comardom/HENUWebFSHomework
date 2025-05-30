
document.addEventListener('DOMContentLoaded', function () {

    initCarousel('carousel', 'carousel-slides', 'prevBtn', 'nextBtn');
});
function initCarousel(containerId, slideId, prevId, nextId) {
    const slides = document.getElementById(slideId);
    const container = document.getElementById(containerId);
    const prevBtn = document.getElementById(prevId);
    const nextBtn = document.getElementById(nextId);

    const totalSlides = slides.children.length;
    let index = 0;
    let timer = null;

    function showSlide(i) {
        slides.style.transform = `translateX(-${i * 100}%)`;
    }

    function nextSlide() {
        index = (index + 1) % totalSlides;
        showSlide(index);
    }

    function prevSlide() {
        index = (index - 1 + totalSlides) % totalSlides;
        showSlide(index);
    }

    function startAuto() {
        timer = setInterval(nextSlide, 3000);
    }

    function stopAuto() {
        clearInterval(timer);
    }

    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    container.addEventListener('mouseenter', stopAuto);
    container.addEventListener('mouseleave', startAuto);

    // 启动轮播
    startAuto();
}



var elements = document.getElementsByClassName('project-content');
Array.from(elements).forEach(element => element.addEventListener('click', function(e) {
    e = e || window.event;
    var target = e.target || e.srcElement;
    var text = target.textContent || text.innerText;
    target.style.display = "none";  
}, false));

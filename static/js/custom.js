$('.project-title').click(function() {
    const project = $(this).closest('.project');
    project.children('.project-content').toggle(300).removeClass('hidden');
    project.siblings().children('.project-content').hide(300).addClass('hidden');
});
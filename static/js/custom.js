$('.project').click(function() {
  $(this).children('.project-content').toggle(300).removeClass('hidden');
  $(this).siblings().children('.project-content').hide(300).addClass('hidden');
});
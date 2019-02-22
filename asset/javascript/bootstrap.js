$(function() {



    $("#menu-toggle").click(function(e) {
        e.preventDefault();
        $("#wrapper").toggleClass("toggled");
    });



    var application = new Planck.Application();


    var router = new Planck.Router(application);
    application.run();
    router.run(1);






});
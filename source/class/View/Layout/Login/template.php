
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="description" content="">
    <meta name="author" content="">




    <title>Dashboard Template for Bootstrap</title>



    <link href="vendor/bootstrap/dist/css/bootstrap.css" rel="stylesheet">





</head>

<body>





<div id="wrapper" class="toggled">




    <!-- Page Content -->
    <div id="page-content-wrapper">
        <div class="container-fluid" id="main-content">


            <form method="post" action="<?php echo $loginURL;?>">
                <input class="material0" placeholder="email" name="email"/>

                <input type="password" class="material0" placeholder="password" name="password"/>

                <button type="submit">Login</button>
            </form>


        </div>
    </div>
    <!-- /#page-content-wrapper -->

</div>
















<style>

    .form-container  {
        padding:0 !important;
    }

    /* necessary to give position: relative to parent. */
    input[type="text"]{
        width: 100%; box-sizing: border-box;
    }

    :focus{outline: none;}



    input.material0, input.material1 {

        border: 0;
        padding: 7px 0;
        border-bottom: 1px solid #ccc;
    }

    input.material0 ~ .focus-border{
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 2px;
        background-color: #4caf50;
        transition: 0.4s;
    }

    input.material0:focus ~ .focus-border{
        width: 100%;
        transition: 0.4s;
    }

    input.material1 ~ .focus-border{
        position: absolute;
        bottom: 0;
        left: 50%;
        width: 0;
        height: 2px;
        background-color: #4caf50;
        transition: 0.4s;
    }

    input.material1:focus ~ .focus-border{
        width: 100%;
        transition: 0.4s;
        left: 0;
    }


</style>









<!-- Bootstrap core CSS -->

<script src="vendor/jquery/dist/jquery.js"></script>

<!-- Popper js -->
<script src="vendor/tether/dist/js/tether.js"></script>
<script src="vendor/popper.min.js"></script>
<!-- Bootstrap-4 js -->
<script src="vendor/bootstrap/dist/js/bootstrap.min.js"></script>
<!-- Menu Toggle Script -->





<script>
    $("#menu-toggle").click(function(e) {
        e.preventDefault();
        $("#wrapper").toggleClass("toggled");
    });
</script>





</body>
</html>

<?php

namespace Planck\Theme\PlanckBoard\View\Component;


use Planck\Application\Application;
use Planck\View\Component;

class Navbar extends Component
{

    public function __construct(Application $application = null)
    {
        parent::__construct($application);


        $html = $this->obInclude(__DIR__.'/template.php');

        $this->dom->html($html, true);


    }





}


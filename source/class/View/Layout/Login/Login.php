<?php

namespace Planck\Theme\PlanckBoard\View\Layout;


use Planck\Application\Application;

class Login extends \Planck\View\Layout
{

    public function __construct(Application $application = null)
    {
        parent::__construct($application);



    }


    public function render()
    {

        $html = $this->obInclude(__DIR__.'/template.php', $this->getVariables());

        $this->setHTML($html, true);

        return parent::render();
    }

}


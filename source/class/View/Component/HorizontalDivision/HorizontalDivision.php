<?php

namespace Planck\Theme\PlanckBoard\View\Component;


use Planck\Application;
use Planck\View\Component;

class HorizontalDivision extends Component
{

    public function __construct(Application $application = null)
    {
        parent::__construct($application);


        $this->addCSSFile(
           'theme/PlanckBoard/source/class/View/Component/HorizontalDivision/style.css'
        );


        /*
        $this->addJavascriptFile(
            'theme/PlanckBoard/source/class/View/Component/HorizontalDivision/test.js'
        );
        */



        $html = '
            <div class="horizontal-division plk-component">
                <div class="top">
    
                    top
    
                </div>
    
                <div class="middle">
                    middle
                </div>
    
                <div class="bottom">
                    bottom
                </div>
    
            </div>
        ';

        $this->dom->html($html, true);


    }





}


<?php

namespace Planck\Theme\PlanckBoard;

use Planck\View\Theme;

class PlanckBoard extends Theme
{


    public function __construct()
    {
        parent::__construct();
    }

    public function getJavascriptURLRoot()
    {
        return 'theme/planck-theme-planck-board/asset/javascript';
    }

    public function getCSSURLRoot()
    {
        return 'theme/planck-theme-planck-board/asset/css';
    }


}






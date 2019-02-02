<?php

namespace Planck\Theme\PlanckBoard\View\Layout;


use Planck\Application;

class Main extends \Planck\View\Layout
{

    public function __construct(Application $application = null)
    {
        parent::__construct($application);

    }


    protected function build()
    {
        $userExtension = $this->application->getExtension(\Planck\Extension\User::class);
        $navbar = new \Planck\Theme\PlanckBoard\View\Component\Navbar();
        $this->registerComponent($navbar, '#layout-top');


        $division = new \Planck\Theme\PlanckBoard\View\Component\HorizontalDivision();

        $this->registerComponent(
            $division,
            '#sidebar-wrapper'
        );


        $logoutURL = $this->application->getExtension($userExtension->getName())->buildURL(
            'Account', 'Api', 'logout'
        );


        $articleURL = $this->application->getExtension(\Planck\Extension\Content::class)->buildURL(
            'Article', 'Main', 'list'
        );

        $imageURL = $this->application->getExtension(\Planck\Extension\Content::class)->buildURL(
            'Image', 'Main', 'list'
        );



        $this->getComponent('#sidebar-wrapper')->find('.top')->html(
            '<div><ul>'.
            '<li><a href="'.$logoutURL.'">Déconnexion</a></li>'.
            '<li><a href="'.$articleURL.'">Articles</a></li>'.
            '<li><a href="'.$imageURL.'">Images</a></li>'.
            '<li><a href="?/tags">Tags</a></li>'.


            '</ul></div>'
        );

        $this->setMainContent($this->application->getOutput());
        $this->addResourcesFromResponses($this->application->getResponses());
    }

    public function render()
    {
        $html = $this->obInclude(__DIR__.'/template.php');
        $this->setHTML($html, true);
        $this->build();
        return parent::render(); // TODO: Change the autogenerated stub
    }

}


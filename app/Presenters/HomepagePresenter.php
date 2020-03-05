<?php

declare(strict_types=1);

namespace App\Presenters;

use Nette;
use App\Model\PeopleManager;
use Nette\Application\UI\Form;


final class HomepagePresenter extends Nette\Application\UI\Presenter
{
    /** @var PeopleManager */
    private $peopleManager;

    public function __construct(PeopleManager $peopleMananger)
    {
        $this->peopleManager = $peopleMananger;
    }

    public function renderDefault():void
    {
        $this->template->people = $this->peopleManager->getPeople();
    }

    public function handleDelete(int $id)
    {
        $this->peopleManager->deleteRowWhere('id',$id);
        //$this->template->people = $this->peopleManager->getPeople();
        if($this->isAjax()){
            $this->redrawAll();
            bdump('redrawed delete');
        }
    }

    public function createComponentAddForm():Form
    {
        $form = new Form;
        $form->addText('name','Name')->setRequired('name is required');
        $form->addText('tel', 'Tel')->setRequired('tel is required');
        $form->addSubmit('submit', 'Add');
        $form->onSuccess[] = [$this,'onAddFormSucceeded'];
        return $form;
    }

    public function onAddFormSucceeded(Form $form, \stdClass $values):void
    {
        $existing = $this->peopleManager->getPeopleWhere('name',$values->name);
        if(empty($existing)){
            $this->peopleManager->insertRow($values->name,$values->tel);
            bdump('successfuly inserted');
        }
        else{
            $form->addError('Name exists');
            bdump('name exists');
        }
        //$this->template->people = $this->peopleManager->getPeople();
        if($this->isAjax()){
            $this->redrawAll();
            bdump('onAddFormSucceeded redrawed');
        }
        else{
            bdump('no ajax');
        }

    
    }

    private function redrawAll()
    {
        $this->redrawControl('table');
        $this->redrawControl('form');
    }

}

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
    private $updateId;

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
        $this->peopleManager->deleteRowWhere('id',strval($id));
        //$this->template->people = $this->peopleManager->getPeople();
        if($this->isAjax()){
            $this->redrawControl();
            bdump('redrawed delete');
        }
    }

    public function handleUpdate(int $id):void
    {
        bdump($id);
        $this->updateId=$id;
        bdump($this->updateId);
        $this->template->updateId = $id;
        $this->redrawControl();
    }

    public function handleOrder(string $value):void
    {
        $order = $this->peopleManager->order($value, 'ASC');
        bdump($order);
        $this->template->people = $order;
        $this->redrawControl('table');
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

    public function createComponentUpdateForm():Form
    {
        $form = new Form;
        $form->addInteger('id','Id');
        $form->addText('name','Name')->setRequired('name is required');
        $form->addText('tel', 'Tel')->setRequired('tel is required');
        $form->addSubmit('submit', 'Update');
        $form->onSuccess[] = [$this,'onUpdateFormSucceeded'];
        return $form;
    }

    public function onAddFormSucceeded(Form $form, \stdClass $values):void
    {
        $existing = $this->peopleManager->getPeopleWhere('name',$values->name);
        if(empty($existing) || $existing->id==$values->id){
            $this->peopleManager->insertRow($values->name,$values->tel);
            bdump('successfuly inserted');
        }
        else{
            $this->flashMessage('Name exists');
            bdump('name exists');
        }
        //$this->template->people = $this->peopleManager->getPeople();
        if($this->isAjax()){
            $this->redrawControl();
            bdump('onAddFormSucceeded redrawed');
        }
        else{
            bdump('no ajax');
        }    
    }

    public function onUpdateFormSucceeded(Form $form, \stdClass $values):void
    { 
        $existing = $this->peopleManager->getPeopleWhere('name',$values->name);
        if(!isset($existing)){          
            $this->peopleManager->update($values->id,$values->name,$values->tel);
        }
        else{
            $this->flashMessage('Name exists');
        }
        if($this->isAjax()){
            $this->redrawControl('table');
        }
        else{
            $this->redirect('Homepage:default');
        }
        
    }
}

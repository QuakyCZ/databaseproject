<?php

declare(strict_types=1);

namespace App\Presenters;

use Nette;
use App\Model\PeopleManager;
use Nette\Application\UI\Form;
use Nette\Application\UI\Multiplier;
use Nette\Utils\FileSystem;

final class HomepagePresenter extends Nette\Application\UI\Presenter
{
    /** @var PeopleManager */
    private $peopleManager;
    private $updateId;
    private $page=1;
    public $pageLimit = 5;
    private $people;
    private $pages;
    private $countryCodes;
    private $countryNames;

    public function __construct(PeopleManager $peopleManager)
    {
        bdump('construct');
        $this->peopleManager = $peopleManager;
        if(empty($this->people)){
            bdump('people empty');
            $this->people=$peopleManager->getPage($this->page,$this->pageLimit);
        }
        $obj = json_decode(file_get_contents('Files/country-codes.json'),true);
        $codes = (array)null;
        $this->countryNames = json_decode(file_get_contents('Files/country-names.json'),true);
        foreach($obj as $key=>$value){
            array_push($codes,$this->countryNames[$key].' +'.$value);
        }
        
        $this->countryCodes = $codes;
    }

    public function renderDefault():void
    {
        $this->template->page=$this->page;
        $this->template->people = $this->people;
        $this->template->updateId=$this->updateId;
        $this->pages = $this->template->pages = ceil($this->people->count('*')/$this->pageLimit);
        bdump('Page: '.$this->page.'/'.$this->pages);

    }

    

    // NEFUNKČNÍ ČÁST
    /*** UPDATE - nefunkční tlačítko SUBMIT ***/
    public function handleUpdate(int $id,int $page):void
    {        
        bdump($id);
        $this->updateId=$id;
        $this->page=$page;
        $this->people=$this->peopleManager->getPage($page,$this->pageLimit);
        bdump($this->updateId);
        
        $this->addComponent($this->createComponentUpdateForm(), 'updateForm');
        if($this->isAjax()){
            $this->redrawControl('table');
            //$this->removeComponent($this->getComponent('updateForm'));
        }
        else{
            $this->redirect("Homepage:default");
        }
    }

    public function handleCancelUpdate():void
    {
        $this->updateId=null;
        $this->people = $this->peopleManager->getPage($this->page,$this->pageLimit);
        if($this->isAjax()){
            $this->redrawControl('table');
        }
    }

    public function createComponentUpdateForm():Multiplier
    {
        return new Multiplier(function($itemId){

            $form = new Form;
            $form->addInteger('id','Id');
            $form->addText('name','Name')->setRequired('name is required');
            $form->addText('tel', 'Tel')->setRequired('tel is required');
            $form->addSubmit('submit', 'Update');        
            $form->onSuccess[] = [$this,'onUpdateFormSucceeded'];
            bdump($form);
            return $form;
        });
        
    }

    public function onUpdateFormSucceeded(Form $form, \stdClass $values):void
    { 
        $existing = $this->peopleManager->getPeopleWhere('name',$values->name);
        if(!isset($existing)){          
            $this->peopleManager->update($values->id,$values->name,$values->tel);
            $this->teplate->updateId=null;
            $this->updateId=null;
        }
        else{
            $this->flashMessage('Name exists');
        }
        if($this->isAjax()){
            $this->redrawControl();
        }
        else{
            $this->redirect('Homepage:default');
        }
        
    }

    // Konec nefunkční části



    /***** AddForm *****/
    public function createComponentAddForm():Form
    {
        $form = new Form;
        $form->addText('name','Name')->setRequired('name is required');        
        $form->addSelect('code','Code: ',$this->countryCodes)->setPrompt('Country code (choose)')->setRequired('Country code is required');
        $form->addText('tel', 'Tel')->setRequired('tel is required')
                                    ->addCondition(FORM::MAX_LENGTH,12)
                                    ->addCondition(FORM::MIN_LENGTH,4)
                                    ->addRule(FORM::FLOAT);
                                    
        $form->addSubmit('submit', 'Add');
        $form->onValidate[] = [$this, 'onAddFormValidate'];
        $form->onSuccess[] = [$this,'onAddFormSucceeded'];
        bdump($form);
        return $form;
    }

   
    
    public function onAddFormValidate($form):void
    {
        $values = $form->getValues();
        bdump($values->code);
    }

    public function onAddFormSucceeded(Form $form, \stdClass $values):void
    {        
        $existing = $this->peopleManager->getPeopleWhere('name',$values->name);
        if(empty($existing)){
            $code = explode(' ', $this->countryCodes[$values->code]);
            $this->peopleManager->insertRow($values->name,end($code).'/'.$values->tel);
            bdump('successfuly inserted');
        }
        else{
            $this->flashMessage('Name exists');
            bdump('name exists');
        }
        $people=$this->peopleManager->getPeople()->count('*');
        $this->pages=intval(ceil($people/$this->pageLimit));
        if($this->pages>$this->page){
            $this->page=$this->pages;
            $this->people=$this->peopleManager->getPage($this->page,$this->pageLimit);
        }
        if($this->isAjax()){
            $this->redrawControl();
            bdump('onAddFormSucceeded redrawed');
        }
        else{
            bdump('no ajax');
        }    
    }
    
    /**** Delete ****/
    public function handleDelete(int $id)
    {
        $this->peopleManager->deleteRowWhere('id',strval($id));
        
        //$this->template->people = $this->peopleManager->getPeople();
        if($this->isAjax()){
            $this->redrawControl();
            bdump('redrawed delete');
        }
    }

    /*** ORDER ***/

    public function handleOrder(string $value):void
    {
        bdump('handleOrder('.$value.')');
        $order = $this->peopleManager->order($value, 'ASC');
        bdump($order);
        $this->template->people = $order;
        if($this->isAjax()){
            $this->redrawControl('table');
        }
        else{
            $this->redirect("Homepage:default");
        }
    }

    /**** Pagination ****/
    public function handlePage(int $page):void
    {
        bdump('Get page '.$page.'/'.$this->pages);
        $this->people = $this->peopleManager->getPage($page,$this->pageLimit);
        $this->page=$page;
        if($this->isAjax()){
            $this->redrawControl();
        }
    }

    

    
}

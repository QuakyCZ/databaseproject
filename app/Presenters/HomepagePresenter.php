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
        $this->template->pages = $this->pages;
        bdump('Page: '.$this->page.'/'.$this->pages);

    }    


    /*** UPDATE ***/
    public function handleUpdate(int $id):void
    {   
        bdump('handleUpdate '.$id);
        $this->updateId=$id;
        if($this->isAjax()){
            $this->redrawControl('updateForm');
        }
    }

    public function handleCancelUpdate():void
    {
        $this->updateId=null;
        $this->people = $this->peopleManager->getPage($this->page,$this->pageLimit);
        if($this->isAjax()){
            $this->redrawControl('updateForm');
        }
    }

    public function createComponentUpdateForm():Multiplier
    {
        return new Multiplier(function($id){
            bdump('createComponentUpdateForm: '.$id);
            $form = new Form;
            $row = $this->peopleManager->getPeopleWhere('id',$id);
            bdump($row);
            $form->addInteger('id','Id')->setValue($id);
            $form->addText('name','Name')->setRequired('name is required')->setValue($row->name);
            $form->addText('tel', 'Tel')->setRequired('tel is required')->setValue($row->telnum);
            $form->addSubmit('submit', 'Update');        
            $form->onSuccess[] = [$this,'onUpdateFormSucceeded'];
            bdump($form);
            return $form;
        });
    }

    public function onUpdateFormSucceeded(Form $form, \stdClass $values):void
    { 
        $existing = $this->peopleManager->getPeopleWhere('id',strval($values->id));
        if(isset($existing)){          
            $this->peopleManager->update($values->id,$values->name,$values->tel);
            $this->updateId=null;
        }
        if($this->isAjax()){
            $this->redrawControl('row-$values->id');
            $this->redrawControl('updateForm');
        }
        else{
            $this->redirect('Homepage:default');
        }
        
    }



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

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
    private $pageLimit = 5;
    private $people;
    private $pages;
    private $countryCodesRaw;
    private $countryCodes;
    private $countryNames;

    public function __construct(PeopleManager $peopleManager)
    {
        bdump('construct');
        $this->peopleManager = $peopleManager;        
        
        $this->pages=$this->peopleManager->getPagesCount($this->pageLimit);

        if(!isset($this->countryCodes)){
            $obj = json_decode(file_get_contents('Files/country-codes.json'),true);
            $codes = (array)null;
            $this->countryCodesRaw=(array)null;
            $this->countryNames = json_decode(file_get_contents('Files/country-names.json'),true);
            foreach($obj as $key=>$value){
                array_push($this->countryCodesRaw,$value);
                array_push($codes,$this->countryNames[$key].' +'.$value);
            }
            
            $this->countryCodes = $codes;
        }
    }

    public function renderDefault():void
    {
        $this->people=$this->peopleManager->getPage($this->page,$this->pageLimit);
        $this->template->people=$this->people;
        $this->template->page=$this->page;
        $this->template->pages=$this->pages;
        $this->template->updateId=$this->updateId;
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
        //$this->people = $this->peopleManager->getPage($this->page,$this->pageLimit);
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
            $number = explode('/', $row->telnum);
            $number[0]=substr($number[0],1);
            bdump(array_keys($this->countryCodesRaw,$number[0]));
            $form->addText('id','Id')->setValue($id)
                                    ->addRule(FORM::FLOAT);
            $form->addText('name','Name')->setRequired('name is required')->setValue($row->name)->setRequired();
            $form->addSelect('code','Code: ',$this->countryCodes)
                                ->setPrompt('Country code (choose)')
                                ->setValue(array_keys($this->countryCodesRaw,$number[0])[0])
                                ->setRequired('Country code is required');
            $form->addText('tel', 'Tel')->setRequired('tel is required')->setValue($number[1])->setRequired();
            $form->addSubmit('submit', 'Update');        
            $form->onSuccess[] = [$this,'onUpdateFormSucceeded'];
            bdump($form);
            return $form;
        });
    }

    public function onUpdateFormSucceeded(Form $form, \stdClass $values):void
    { 
        $existing = $this->peopleManager->getPeopleWhere('id',strval(intval($values->id)));
        if(isset($existing)){          
            $this->peopleManager->update($values->id,$values->name,$values->tel);
            $this->updateId=null;
            $this->page=$this->peopleManager->getPageOfId($values->id,$this->pageLimit);
        }
        if($this->isAjax()){
            $this->redrawControl('table');
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
        $form->addText('name','Name')->addRule(FORM::MIN_LENGTH, 'Jméno musí mít alespoň 3 písmena', 3)
                                    ->addRule(FORM::MAX_LENGTH, 'Jméno je moc dlouhé. Maximální počet znaků je 15', 15);        
        
        $form->addSelect('code','Code: ',$this->countryCodes)
                        ->setPrompt('Country code (choose)')
                        ->setRequired('Country code is required');
        
        $form->addText('tel', 'Tel')->addRule(FORM::FLOAT, 'Vložen špatný formát čísla')
                                    ->addRule(FORM::MIN_LENGTH, 'Číslo musí obsahovat alespoň 4 číslice.', 4)
                                    ->addRule(FORM::MAX_LENGTH, 'Číslo musí obsahovat maximálně 15 číslic', 15);
                                    
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
        $this->pages=$this->peopleManager->getPagesCount($this->pageLimit);
        if($this->pages>$this->page){
            $this->page=$this->pages;
            //$this->people=$this->peopleManager->getPage($this->page,$this->pageLimit);
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
    public function handleDelete(int $id, bool $delete)
    {
        $page = $this->peopleManager->getPageOfId($id,$this->pageLimit);
        $count = $this->peopleManager->getPagesCount($this->pageLimit);
        if($count<$this->page){
            $this->page=$count;
        }
        else{
            $this->page=$page;
        }
        if($delete==true){
            $this->peopleManager->deleteRowWhere('id',strval($id));
            $this->template->deleteId=null;

        }
        else{            
            $this->template->deleteId=$id;
        }
        
        bdump('handle delete page '.$this->page);
        //$this->template->people = $this->peopleManager->getPeople();
        if($this->isAjax()){
            $this->redrawControl('table');
        }
    }

    public function handleCancelDelete()
    {
        $this->template->deleteId=null;
        if($this->isAjax()){
            $this->redrawControl('table');
        }
    }

    public function handleDeleteAll()
    {
        $this->peopleManager->getPeople()->delete();
        $this->page=1;
        if($this->isAjax()){
            $this->redrawControl('table');
        }
        else{
            $this->redirect('Homepage:default');
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
        $this->page = $page;
        if($this->isAjax()){
            $this->redrawControl('table');
            $this->redrawControl('pagination');
        }
        else{
            $this->redirect('Homepage:default');
        }
    }


}

<?php

declare(strict_types=1);

namespace App\Presenters;

use Nette;
use Nette\Application\UI\Form;



final class HomepagePresenter extends Nette\Application\UI\Presenter
{
   /**@var Nette\Database\Context */
   private $database;
   private $sort = false;
   public function __construct(Nette\Database\Context $database)
   {
       $this->database = $database;
       $this->sort=false;
       
   }
   
   public function renderDefault():void
   {
       if($this->sort==false){
            $this->template->rows = $this->database->table('people');
            $this->template->lastSortMethod='ASC';
       }
       
   }

   public function createComponentAddForm():Form
   {   
       $form = new Form;
       $form->addText('name','Name')->setRequired('name is required');
       $form->addText('tel','TelNum')->setRequired('tel is required');
       $form->addSubmit('add','Add');
       $form->onSuccess[] = [$this,'onAddFormSucceeded'];
       return $form;
   }

   public function onAddFormSucceeded(Form $form, \stdClass $values):void
   {
       if($this->database->table('people')->where('name',$values->name)->count('*')>0){
           $form->addError('Given name already exists.');
       }
       $this->database->table('people')->insert([
            'name'=>$values->name,
            'telnum'=>$values->tel
       ]);
       $this->redrawControl('table');
   }

   public function handleUpdate(int $id):void
   {    if(isset($this->template->rows)){
            $this->template->rows[$id] = $this->database->table('people')->where('id',$id);
        }
        $this->redrawControl('table');
   }

   public function handleDelete(int $id):void
   {
        $this->database->table('people')->where('id',$id)->delete();
        
        $this->redrawControl('table');    
   }
   public function handleOnSort(string $column):void
   {
       if($this->presenter->isAjax()){
           echo 'yes';
       }
        $method = 'ASC';
        if(isset($this->template->lastSortMethod)){
            if($this->template->lastSortMethod=='ASC'){
                echo 'ASC->DESC';
                    $method='DESC';
            }
            elseif($this->template->lastSortMethod=='DESC'){
                echo 'DESC->ASC';
                $method='ASC';           
            }
        }
        else{
            $this->template->lastSortMethod = $method='ASC';
        }
           
       
       echo $method;
       $this->template->lastSortMethod=strval($method);
       $this->sort=true;
       $this->template->rows = $this->database->table('people')->order($column.' '.$method);
       $this->redrawControl('table');
   }
}

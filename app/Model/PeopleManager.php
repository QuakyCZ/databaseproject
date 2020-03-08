<?php

declare(strict_types=1);

namespace App\Model;

use Nette;


class PeopleManager
{
    private $database;
    public function __construct(Nette\Database\Context $database)
    {
        $this->database = $database;
    }

    public function getPeople()
    {
        return $this->database->table('people');
    }

    public function getPage(int $pageId, int $amount)
    {
        bdump('getPage: '.$pageId.','.$amount);
        return $this->database->table('people')->page($pageId,$amount);
    }

    public function getPeopleWhere($column,$value)
    {
        return $this->database->table('people')->where($column,$value)->fetch();
    }

    public function insertRow(string $name, string $tel):void
    {
        $this->database->table('people')->insert([
            'name'=>$name,
            'telnum'=>$tel
        ]);
    }

    public function deleteRowWhere(string $column,string $value)
    {
        $this->database->table('people')->where($column,$value)->delete();
    }

    public function update(int $id, string $name, string $tel):void
    {
        $this->database->table('people')->where('name',$name)->update([
            'name'=>$name,
            'telnum'=>$tel
        ]);
    }

    public function order(string $column,string $method)
    {
        bdump($column.', '.$method);
        $result = $this->database->table('people')->order($column.' '.$method);
        bdump($result);
        return $result;
    }
}

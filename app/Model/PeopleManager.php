<?php

declare(strict_types=1);

namespace App\Model;

use Nette;


final class PeopleManager
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

    public function deleteRowWhere(string $column,$value)
    {
        $this->database->table('people')->where($column,$value)->delete();
    }
}

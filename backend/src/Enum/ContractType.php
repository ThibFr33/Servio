<?php

declare(strict_types=1);

namespace App\Enum;

enum ContractType: string
{
    case Cdi = 'cdi';
    case Cdd = 'cdd';
    case Extra = 'extra';
    case Apprentice = 'apprentice';
}

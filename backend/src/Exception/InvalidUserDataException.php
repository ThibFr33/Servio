<?php

declare(strict_types=1);

namespace App\Exception;

final class InvalidUserDataException extends \InvalidArgumentException
{
    /**
     * @param list<string> $errors one readable message per invalid field
     */
    public function __construct(private readonly array $errors)
    {
        parent::__construct('Invalid user data: '.implode(' ', $errors));
    }

    /**
     * @return list<string>
     */
    public function getErrors(): array
    {
        return $this->errors;
    }
}
